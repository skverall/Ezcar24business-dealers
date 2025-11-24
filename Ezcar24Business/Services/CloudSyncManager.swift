import Foundation
import CoreData
import Supabase

enum SyncHUDState: Equatable {
    case syncing
    case success
    case failure
}


@MainActor
final class CloudSyncManager: ObservableObject {
    static var shared: CloudSyncManager?

    private let client: SupabaseClient
    private let adminClient: SupabaseClient?
    private var writeClient: SupabaseClient { adminClient ?? client }
    private let context: NSManagedObjectContext

    @Published private(set) var isSyncing = false
    @Published private(set) var lastSyncAt: Date?
    @Published var syncHUDState: SyncHUDState?
    @Published var errorMessage: String?

    private var lastSyncTimestamp: Date? {
        get { UserDefaults.standard.object(forKey: "lastSyncTimestamp") as? Date }
        set { UserDefaults.standard.set(newValue, forKey: "lastSyncTimestamp") }
    }

    init(client: SupabaseClient, adminClient: SupabaseClient?, context: NSManagedObjectContext) {
        self.client = client
        self.adminClient = adminClient
        self.context = context
    }

    // MARK: - Public API

    func syncAfterLogin(user: Auth.User) async {
        guard !isSyncing else { return }
        isSyncing = true
        
        // Only show blocking HUD if this is the first sync ever
        let isFirstSync = lastSyncTimestamp == nil
        if isFirstSync {
            syncHUDState = .syncing
        }
        
        defer { isSyncing = false }

        do {
            let dealerId = user.id
            // 1. Push local changes
            try await pushLocalChanges(dealerId: dealerId)

            // 2. Fetch remote changes (Delta Sync)
            let since = lastSyncTimestamp
            let snapshot = try await fetchRemoteChanges(dealerId: dealerId, since: since)
            
            // 3. Check for default accounts (only if we have no local accounts)
            let localAccountCount = try context.count(for: FinancialAccount.fetchRequest())
            if localAccountCount == 0 {
                _ = try await ensureDefaultAccounts(for: dealerId, existingAccounts: snapshot.accounts)
            }

            // 4. Smart Merge
            try await mergeRemoteChanges(snapshot, dealerId: dealerId)
            
            // 5. Update timestamp
            lastSyncTimestamp = Date()
            lastSyncAt = lastSyncTimestamp
            
            // 6. Background tasks
            Task { [weak self] in
                await self?.downloadVehicleImages(dealerId: dealerId, vehicles: snapshot.vehicles)
            }
            
            if isFirstSync {
                syncHUDState = .success
                scheduleHideHUD(for: .success)
            }
            
            // 7. Process offline queue
            await processOfflineQueue()
        } catch {
            print("CloudSyncManager sync error: \(error)")
            if isFirstSync {
                syncHUDState = .failure
                scheduleHideHUD(for: .failure)
            }
            showError("Sync failed: \(error.localizedDescription)")
        }
    }

    func showError(_ message: String) {
        Task { @MainActor in
            self.errorMessage = message
            // Auto-dismiss after 5 seconds
            try? await Task.sleep(nanoseconds: 5 * 1_000_000_000)
            if self.errorMessage == message {
                self.errorMessage = nil
            }
        }
    }

    private func scheduleHideHUD(for state: SyncHUDState) {
        let delay: UInt64
        switch state {
        case .success:
            delay = 1_200_000_000 // ~1.2 seconds
        case .failure:
            delay = 1_800_000_000 // ~1.8 seconds
        case .syncing:
            return
        }

        Task { @MainActor in
            try? await Task.sleep(nanoseconds: delay)
            if self.syncHUDState == state {
                self.syncHUDState = nil
            }
        }
    }


    // MARK: - Offline Queue Processing
    
    func processOfflineQueue() async {
        let items = await SyncQueueManager.shared.getAllItems()
        guard !items.isEmpty else { return }
        
        for item in items {
            do {
                switch item.operation {
                case .upsert:
                    try await processUpsert(item)
                case .delete:
                    try await processDelete(item)
                }
                await SyncQueueManager.shared.remove(id: item.id)
            } catch {
                print("Failed to process offline item \(item.id): \(error)")
            }
        }
    }

    private func processUpsert(_ item: SyncQueueItem) async throws {
        let decoder = JSONDecoder()
        switch item.entityType {
        case .vehicle:
            let remote = try decoder.decode(RemoteVehicle.self, from: item.payload)
            try await writeClient.from("vehicles").upsert(remote).execute()
        case .expense:
            let remote = try decoder.decode(RemoteExpense.self, from: item.payload)
            try await writeClient.from("expenses").upsert(remote).execute()
        case .sale:
            let remote = try decoder.decode(RemoteSale.self, from: item.payload)
            try await writeClient.from("sales").upsert(remote).execute()
        case .client:
            let remote = try decoder.decode(RemoteClient.self, from: item.payload)
            try await writeClient.from("dealer_clients").upsert(remote).execute()
        case .user:
            let remote = try decoder.decode(RemoteDealerUser.self, from: item.payload)
            try await writeClient.from("dealer_users").upsert(remote).execute()
        case .account:
             let remote = try decoder.decode(RemoteFinancialAccount.self, from: item.payload)
             try await writeClient.from("financial_accounts").upsert(remote).execute()
        case .template:
             let remote = try decoder.decode(RemoteExpenseTemplate.self, from: item.payload)
             try await writeClient.from("expense_templates").upsert(remote).execute()
        }
    }

    private func processDelete(_ item: SyncQueueItem) async throws {
        let decoder = JSONDecoder()
        let id = try decoder.decode(UUID.self, from: item.payload)
        let table: String
        switch item.entityType {
        case .vehicle: table = "vehicles"
        case .expense: table = "expenses"
        case .sale: table = "sales"
        case .client: table = "dealer_clients"
        case .user: table = "dealer_users"
        case .account: table = "financial_accounts"
        case .template: table = "expense_templates"
        }
        try await writeClient.from(table).delete().eq("id", value: id).execute()
    }

    func upsertVehicle(_ vehicle: Vehicle, dealerId: UUID) async {
        guard let remote = makeRemoteVehicle(from: vehicle, dealerId: dealerId) else { return }
        do {
            try await writeClient
                .from("vehicles")
                .upsert(remote)
                .execute()
            await processOfflineQueue()
        } catch {
            print("CloudSyncManager upsertVehicle error: \(error)")
            showError("Failed to save vehicle. Queued for offline sync.")
            if let data = try? JSONEncoder().encode(remote) {
                let item = SyncQueueItem(entityType: .vehicle, operation: .upsert, payload: data, dealerId: dealerId)
                await SyncQueueManager.shared.enqueue(item: item)
            }
        }
    }

    func deleteVehicle(_ vehicle: Vehicle, dealerId: UUID) async {
        guard let id = vehicle.id else { return }
        do {
            try await writeClient
                .from("vehicles")
                .delete()
                .eq("id", value: id)
                .execute()
            // Also remove image from cloud storage (best-effort).
            await deleteVehicleImage(vehicleId: id, dealerId: dealerId)
            await processOfflineQueue()
        } catch {
            print("CloudSyncManager deleteVehicle error: \(error)")
            showError("Failed to delete vehicle. Queued for offline sync.")
            if let data = try? JSONEncoder().encode(id) {
                let item = SyncQueueItem(entityType: .vehicle, operation: .delete, payload: data, dealerId: dealerId)
                await SyncQueueManager.shared.enqueue(item: item)
            }
        }
    }

    func upsertExpense(_ expense: Expense, dealerId: UUID) async {
        guard let remote = makeRemoteExpense(from: expense, dealerId: dealerId) else { return }
        do {
            try await writeClient
                .from("expenses")
                .upsert(remote)
                .execute()
            await processOfflineQueue()
        } catch {
            print("CloudSyncManager upsertExpense error: \(error)")
            showError("Failed to save expense. Queued for offline sync.")
            if let data = try? JSONEncoder().encode(remote) {
                let item = SyncQueueItem(entityType: .expense, operation: .upsert, payload: data, dealerId: dealerId)
                await SyncQueueManager.shared.enqueue(item: item)
            }
        }
    }

    func deleteExpense(_ expense: Expense, dealerId: UUID) async {
        guard let id = expense.id else { return }
        do {
            try await writeClient
                .from("expenses")
                .delete()
                .eq("id", value: id)
                .execute()
            await processOfflineQueue()
        } catch {
            print("CloudSyncManager deleteExpense error: \(error)")
            showError("Failed to delete expense. Queued for offline sync.")
            if let data = try? JSONEncoder().encode(id) {
                let item = SyncQueueItem(entityType: .expense, operation: .delete, payload: data, dealerId: dealerId)
                await SyncQueueManager.shared.enqueue(item: item)
            }
        }
    }

    func upsertSale(_ sale: Sale, dealerId: UUID) async {
        guard let remote = makeRemoteSale(from: sale, dealerId: dealerId) else { return }
        do {
            try await writeClient
                .from("sales")
                .upsert(remote)
                .execute()
            await processOfflineQueue()
        } catch {
            print("CloudSyncManager upsertSale error: \(error)")
            showError("Failed to save sale. Queued for offline sync.")
            if let data = try? JSONEncoder().encode(remote) {
                let item = SyncQueueItem(entityType: .sale, operation: .upsert, payload: data, dealerId: dealerId)
                await SyncQueueManager.shared.enqueue(item: item)
            }
        }
    }

    func deleteSale(_ sale: Sale, dealerId: UUID) async {
        guard let id = sale.id else { return }
        do {
            try await writeClient
                .from("sales")
                .delete()
                .eq("id", value: id)
                .execute()
            await processOfflineQueue()
        } catch {
            print("CloudSyncManager deleteSale error: \(error)")
            showError("Failed to delete sale. Queued for offline sync.")
            if let data = try? JSONEncoder().encode(id) {
                let item = SyncQueueItem(entityType: .sale, operation: .delete, payload: data, dealerId: dealerId)
                await SyncQueueManager.shared.enqueue(item: item)
            }
        }
    }

    func upsertUser(_ user: User, dealerId: UUID) async {
        guard let id = user.id else { return }
        let remote = RemoteDealerUser(
            id: id,
            dealerId: dealerId,
            name: user.name ?? "",
            createdAt: user.createdAt ?? Date(),
            updatedAt: user.updatedAt ?? Date()
        )
        do {
            try await writeClient
                .from("dealer_users")
                .upsert(remote)
                .execute()
            await processOfflineQueue()
        } catch {
            print("CloudSyncManager upsertUser error: \(error)")
            showError("Failed to save user. Queued for offline sync.")
            if let data = try? JSONEncoder().encode(remote) {
                let item = SyncQueueItem(entityType: .user, operation: .upsert, payload: data, dealerId: dealerId)
                await SyncQueueManager.shared.enqueue(item: item)
            }
        }
    }

    func deleteUser(_ user: User, dealerId: UUID) async {
        guard let id = user.id else { return }
        do {
            try await writeClient
                .from("dealer_users")
                .delete()
                .eq("id", value: id)
                .execute()
            await processOfflineQueue()
        } catch {
            print("CloudSyncManager deleteUser error: \(error)")
            showError("Failed to delete user. Queued for offline sync.")
            if let data = try? JSONEncoder().encode(id) {
                let item = SyncQueueItem(entityType: .user, operation: .delete, payload: data, dealerId: dealerId)
                await SyncQueueManager.shared.enqueue(item: item)
            }
        }
    }

    func upsertClient(_ clientObject: Client, dealerId: UUID) async {
        guard let remote = makeRemoteClient(from: clientObject, dealerId: dealerId) else { return }
        do {
            try await writeClient
                .from("dealer_clients")
                .upsert(remote)
                .execute()
            await processOfflineQueue()
        } catch {
            print("CloudSyncManager upsertClient error: \(error)")
            showError("Failed to save client. Queued for offline sync.")
            if let data = try? JSONEncoder().encode(remote) {
                let item = SyncQueueItem(entityType: .client, operation: .upsert, payload: data, dealerId: dealerId)
                await SyncQueueManager.shared.enqueue(item: item)
            }
        }
    }

    func deleteClient(_ clientObject: Client, dealerId: UUID) async {
        guard let id = clientObject.id else { return }
        do {
            try await writeClient
                .from("dealer_clients")
                .delete()
                .eq("id", value: id)
                .execute()
            await processOfflineQueue()
        } catch {
            print("CloudSyncManager deleteClient error: \(error)")
            showError("Failed to delete client. Queued for offline sync.")
            if let data = try? JSONEncoder().encode(id) {
                let item = SyncQueueItem(entityType: .client, operation: .delete, payload: data, dealerId: dealerId)
                await SyncQueueManager.shared.enqueue(item: item)
            }
        }
    }

    // MARK: - Vehicle images

    private func imagePath(dealerId: UUID, vehicleId: UUID) -> String {
        "\(dealerId.uuidString)/vehicles/\(vehicleId.uuidString).jpg"
    }

    func uploadVehicleImage(vehicleId: UUID, dealerId: UUID, imageData: Data) async {
        do {
            let path = imagePath(dealerId: dealerId, vehicleId: vehicleId)
            try await client.storage
                .from("vehicle-images")
                .upload(
                    path,
                    data: imageData,
                    options: FileOptions(
                        cacheControl: "3600",
                        contentType: "image/jpeg",
                        upsert: true
                    )
                )
        } catch {
            print("CloudSyncManager uploadVehicleImage error: \(error)")
        }
    }

    func deleteVehicleImage(vehicleId: UUID, dealerId: UUID) async {
        do {
            let path = imagePath(dealerId: dealerId, vehicleId: vehicleId)
            _ = try await client.storage
                .from("vehicle-images")
                .remove(paths: [path])
        } catch {
            print("CloudSyncManager deleteVehicleImage error: \(error)")
        }
    }

    private func downloadVehicleImages(dealerId: UUID, vehicles: [RemoteVehicle]) async {
        for vehicle in vehicles {
            let path = imagePath(dealerId: dealerId, vehicleId: vehicle.id)
            do {
                let data = try await client.storage
                    .from("vehicle-images")
                    .download(path: path)
                ImageStore.shared.save(imageData: data, for: vehicle.id)
            } catch {
                // It's fine if an image does not exist for a vehicle.
            }
        }
    }

    // MARK: - Backups

    func uploadBackupArchive(at url: URL, dealerId: UUID) async {
        do {
            let data = try Data(contentsOf: url)
            let filename = url.lastPathComponent
            let path = "\(dealerId.uuidString)/backups/\(filename)"
            try await client.storage
                .from("dealer-backups")
                .upload(
                    path,
                    data: data,
                    options: FileOptions(
                        cacheControl: "0",
                        contentType: "application/zip",
                        upsert: true
                    )
                )
            await MainActor.run {
                self.syncHUDState = .success
                self.scheduleHideHUD(for: .success)
                self.lastSyncAt = Date()
            }
        } catch {
            print("CloudSyncManager uploadBackupArchive error: \(error)")
            showError("Backup upload failed: \(error.localizedDescription)")
        }
    }

    // MARK: - Snapshot fetch & apply

    private func fetchRemoteChanges(dealerId: UUID, since: Date?) async throws -> RemoteSnapshot {
        // Helper to build query with pagination.
        // Some tables (like vehicles, expenses, sales, dealer_clients) don't have an
        // updated_at column in Supabase yet, so we allow opting out of the
        // incremental filter and fetch full snapshots for them.
        func query<T: Decodable>(_ table: String, useUpdatedAt: Bool) async throws -> [T] {
            var allItems: [T] = []
            let pageSize = 1000
            var from = 0

            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

            while true {
                var builder = client.from(table).select().eq("dealer_id", value: dealerId)
                if useUpdatedAt, let date = since {
                    let dateString = formatter.string(from: date)
                    builder = builder.gt("updated_at", value: dateString)
                }

                let page: [T] = try await builder
                    .range(from: from, to: from + pageSize - 1)
                    .execute()
                    .value

                allItems.append(contentsOf: page)

                if page.count < pageSize {
                    break
                }
                from += pageSize
            }
            return allItems
        }

        // Only tables that actually have `updated_at` use incremental sync.
        async let users: [RemoteDealerUser] = query("dealer_users", useUpdatedAt: true)
        async let accounts: [RemoteFinancialAccount] = query("financial_accounts", useUpdatedAt: true)
        async let vehicles: [RemoteVehicle] = query("vehicles", useUpdatedAt: false)
        async let templates: [RemoteExpenseTemplate] = query("expense_templates", useUpdatedAt: false)
        async let expenses: [RemoteExpense] = query("expenses", useUpdatedAt: false)
        async let sales: [RemoteSale] = query("sales", useUpdatedAt: false)
        async let clients: [RemoteClient] = query("dealer_clients", useUpdatedAt: false)

        return try await RemoteSnapshot(
            users: users,
            accounts: accounts,
            vehicles: vehicles,
            templates: templates,
            expenses: expenses,
            sales: sales,
            clients: clients
        )
    }

    // Ensure that each dealer has at least a couple of basic accounts so that
    // the Add Expense screen never shows an empty list.
    private func ensureDefaultAccounts(for dealerId: UUID, existingAccounts: [RemoteFinancialAccount]) async throws -> [RemoteFinancialAccount] {
        // If there are already accounts in the cloud, just use them.
        guard existingAccounts.isEmpty else { return existingAccounts }

        let now = Date()
        let defaults = ["Cash", "Bank"]
        let newAccounts: [RemoteFinancialAccount] = defaults.map { name in
            RemoteFinancialAccount(
                id: UUID(),
                dealerId: dealerId,
                accountType: name,
                balance: 0,
                updatedAt: now
            )
        }

        do {
            try await writeClient
                .from("financial_accounts")
                .insert(newAccounts)
                .execute()
        } catch {
            // If insert fails, log but still return the locally constructed defaults
            // so that the UI can work with accounts in this session.
            print("CloudSyncManager ensureDefaultAccounts insert error: \(error)")
        }

        return newAccounts
    }

    private func mergeRemoteChanges(_ snapshot: RemoteSnapshot, dealerId: UUID) async throws {
        // Perform merge on a background context to avoid blocking UI
        try await context.perform { [weak self] in
            guard let self = self else { return }
            let context = self.context
            
            // Helpers for fetching existing objects
            func fetchExisting<T: NSManagedObject>(entityName: String, ids: [UUID]) -> [UUID: T] {
                let request = NSFetchRequest<T>(entityName: entityName)
                request.predicate = NSPredicate(format: "id IN %@", ids)
                do {
                    let results = try context.fetch(request)
                    // Assuming 'id' is available on T (we know it is for our models)
                    var map: [UUID: T] = [:]
                    for obj in results {
                        if let id = obj.value(forKey: "id") as? UUID {
                            map[id] = obj
                        }
                    }
                    return map
                } catch {
                    print("Error fetching existing \(entityName): \(error)")
                    return [:]
                }
            }

            // 1. Users
            let userIds = snapshot.users.map { $0.id }
            let existingUsers: [UUID: User] = fetchExisting(entityName: "User", ids: userIds)
            for u in snapshot.users {
                let obj = existingUsers[u.id] ?? User(context: context)
                obj.id = u.id
                obj.name = u.name
                obj.createdAt = u.createdAt
                obj.updatedAt = u.updatedAt
            }

            // 2. Accounts
            let accountIds = snapshot.accounts.map { $0.id }
            let existingAccounts: [UUID: FinancialAccount] = fetchExisting(entityName: "FinancialAccount", ids: accountIds)
            for a in snapshot.accounts {
                let obj = existingAccounts[a.id] ?? FinancialAccount(context: context)
                obj.id = a.id
                obj.accountType = a.accountType
                obj.balance = NSDecimalNumber(decimal: a.balance)
                obj.updatedAt = a.updatedAt
            }

            // 3. Vehicles
            let vehicleIds = snapshot.vehicles.map { $0.id }
            let existingVehicles: [UUID: Vehicle] = fetchExisting(entityName: "Vehicle", ids: vehicleIds)
            for v in snapshot.vehicles {
                let obj = existingVehicles[v.id] ?? Vehicle(context: context)
                obj.id = v.id
                obj.vin = v.vin
                obj.make = v.make
                obj.model = v.model
                if let year = v.year { obj.year = Int32(year) }
                obj.purchasePrice = NSDecimalNumber(decimal: v.purchasePrice)
                if let d = Self.parseDateOnly(v.purchaseDate) {
                    obj.purchaseDate = d
                } else {
                    obj.purchaseDate = v.createdAt
                }
                obj.status = v.status
                obj.notes = v.notes
                obj.createdAt = v.createdAt
                if let salePrice = v.salePrice { obj.salePrice = NSDecimalNumber(decimal: salePrice) }
                if let saleDateString = v.saleDate, let saleDate = Self.parseDateOnly(saleDateString) {
                    obj.saleDate = saleDate
                } else {
                    obj.saleDate = nil
                }
            }

            // 4. Clients
            let clientIds = snapshot.clients.map { $0.id }
            let existingClients: [UUID: Client] = fetchExisting(entityName: "Client", ids: clientIds)
            for c in snapshot.clients {
                let obj = existingClients[c.id] ?? Client(context: context)
                obj.id = c.id
                obj.name = c.name
                obj.phone = c.phone
                obj.email = c.email
                obj.notes = c.notes
                obj.requestDetails = c.requestDetails
                obj.preferredDate = c.preferredDate
                obj.createdAt = c.createdAt
                obj.status = c.status
            }

            // 5. Templates
            let templateIds = snapshot.templates.map { $0.id }
            let existingTemplates: [UUID: ExpenseTemplate] = fetchExisting(entityName: "ExpenseTemplate", ids: templateIds)
            for t in snapshot.templates {
                let obj = existingTemplates[t.id] ?? ExpenseTemplate(context: context)
                obj.id = t.id
                obj.name = t.name
                obj.category = t.category
                if let d = t.defaultAmount { obj.defaultAmount = NSDecimalNumber(decimal: d) }
                obj.defaultDescription = t.defaultDescription
            }

            // 6. Expenses
            let expenseIds = snapshot.expenses.map { $0.id }
            let existingExpenses: [UUID: Expense] = fetchExisting(entityName: "Expense", ids: expenseIds)
            for e in snapshot.expenses {
                let obj = existingExpenses[e.id] ?? Expense(context: context)
                obj.id = e.id
                obj.amount = NSDecimalNumber(decimal: e.amount)
                if let d = Self.parseDateOnly(e.date) {
                    obj.date = d
                } else {
                    obj.date = e.createdAt
                }
                obj.expenseDescription = e.expenseDescription
                obj.category = e.category
                obj.createdAt = e.createdAt
            }

            // 7. Sales
            let saleIds = snapshot.sales.map { $0.id }
            let existingSales: [UUID: Sale] = fetchExisting(entityName: "Sale", ids: saleIds)
            for s in snapshot.sales {
                let obj = existingSales[s.id] ?? Sale(context: context)
                obj.id = s.id
                obj.amount = NSDecimalNumber(decimal: s.amount)
                if let d = Self.parseDateOnly(s.date) {
                    obj.date = d
                } else {
                    obj.date = s.createdAt
                }
                obj.buyerName = s.buyerName
                obj.buyerPhone = s.buyerPhone
                obj.paymentMethod = s.paymentMethod
            }

            // Save first pass (objects created/updated)
            if context.hasChanges {
                try context.save()
            }

            // Second pass: Relationships
            // We need to fetch everything again or use the maps if we kept them updated.
            // For simplicity, let's re-fetch or use the maps we built (but we need to add new ones to maps).
            // Actually, since we are in the same context block, we can just fetch relationships by ID.
            
            // Re-fetch maps to include newly created objects
            let allVehicles: [UUID: Vehicle] = fetchExisting(entityName: "Vehicle", ids: snapshot.vehicles.map { $0.id } + snapshot.clients.compactMap { $0.vehicleId } + snapshot.sales.map { $0.vehicleId } + snapshot.expenses.compactMap { $0.vehicleId })
            let allUsers: [UUID: User] = fetchExisting(entityName: "User", ids: snapshot.users.map { $0.id } + snapshot.expenses.compactMap { $0.userId })
            let allAccounts: [UUID: FinancialAccount] = fetchExisting(entityName: "FinancialAccount", ids: snapshot.accounts.map { $0.id } + snapshot.expenses.compactMap { $0.accountId })
            
            // Link Clients -> Vehicles
            for c in snapshot.clients {
                if let vId = c.vehicleId, let client = existingClients[c.id] ?? (try? context.fetch(Client.fetchRequest()).first(where: { $0.id == c.id })) {
                    client.vehicle = allVehicles[vId]
                }
            }
            
            // Link Expenses -> Vehicle, User, Account
            for e in snapshot.expenses {
                 if let expense = existingExpenses[e.id] ?? (try? context.fetch(Expense.fetchRequest()).first(where: { $0.id == e.id })) {
                     if let vId = e.vehicleId { expense.vehicle = allVehicles[vId] }
                     if let uId = e.userId { expense.user = allUsers[uId] }
                     if let aId = e.accountId { expense.account = allAccounts[aId] }
                 }
            }
            
            // Link Sales -> Vehicle
            for s in snapshot.sales {
                if let sale = existingSales[s.id] ?? (try? context.fetch(Sale.fetchRequest()).first(where: { $0.id == s.id })) {
                    if let v = allVehicles[s.vehicleId] {
                        sale.vehicle = v
                    }
                }
            }

            if context.hasChanges {
                try context.save()
            }
        }
    }

    // MARK: - Mapping helpers

    private static let dateOnlyFormatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(secondsFromGMT: 0)
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static func parseDateOnly(_ string: String) -> Date? {
        dateOnlyFormatter.date(from: string)
    }
    // Push local Core Data state to Supabase so we don't lose offline changes when applying a remote snapshot.
    private func pushLocalChanges(dealerId: UUID) async throws {
        // Fetch current local objects
        let userRequest: NSFetchRequest<User> = User.fetchRequest()
        let accountRequest: NSFetchRequest<FinancialAccount> = FinancialAccount.fetchRequest()
        let vehicleRequest: NSFetchRequest<Vehicle> = Vehicle.fetchRequest()
        let expenseRequest: NSFetchRequest<Expense> = Expense.fetchRequest()
        let saleRequest: NSFetchRequest<Sale> = Sale.fetchRequest()
        let clientRequest: NSFetchRequest<Client> = Client.fetchRequest()
        let templateRequest: NSFetchRequest<ExpenseTemplate> = ExpenseTemplate.fetchRequest()

        let users = try context.fetch(userRequest)
        let accounts = try context.fetch(accountRequest)
        let vehicles = try context.fetch(vehicleRequest)
        let expenses = try context.fetch(expenseRequest)
        let sales = try context.fetch(saleRequest)
        let clients = try context.fetch(clientRequest)
        let templates = try context.fetch(templateRequest)

        // Map to remote models
        let remoteUsers: [RemoteDealerUser] = users.compactMap { user in
            guard let id = user.id else { return nil }
            return RemoteDealerUser(
                id: id,
                dealerId: dealerId,
                name: user.name ?? "",
                createdAt: user.createdAt ?? Date(),
                updatedAt: user.updatedAt ?? Date()
            )
        }

        let remoteAccounts: [RemoteFinancialAccount] = accounts.compactMap { account in
            makeRemoteFinancialAccount(from: account, dealerId: dealerId)
        }

        let remoteVehicles: [RemoteVehicle] = vehicles.compactMap { vehicle in
            makeRemoteVehicle(from: vehicle, dealerId: dealerId)
        }

        let remoteExpenses: [RemoteExpense] = expenses.compactMap { expense in
            makeRemoteExpense(from: expense, dealerId: dealerId)
        }

        let remoteSales: [RemoteSale] = sales.compactMap { sale in
            makeRemoteSale(from: sale, dealerId: dealerId)
        }

        let remoteClients: [RemoteClient] = clients.compactMap { client in
            makeRemoteClient(from: client, dealerId: dealerId)
        }

        let remoteTemplates: [RemoteExpenseTemplate] = templates.compactMap { template in
            makeRemoteTemplate(from: template, dealerId: dealerId)
        }

        // Push to Supabase. If any of these throws, we fail the sync rather than wiping local data.
        if !remoteUsers.isEmpty {
            try await writeClient
                .from("dealer_users")
                .upsert(remoteUsers)
                .execute()
        }

        if !remoteAccounts.isEmpty {
            try await writeClient
                .from("financial_accounts")
                .upsert(remoteAccounts)
                .execute()
        }

        if !remoteVehicles.isEmpty {
            try await writeClient
                .from("vehicles")
                .upsert(remoteVehicles)
                .execute()
        }

        if !remoteTemplates.isEmpty {
            try await writeClient
                .from("expense_templates")
                .upsert(remoteTemplates)
                .execute()
        }

        if !remoteExpenses.isEmpty {
            try await writeClient
                .from("expenses")
                .upsert(remoteExpenses)
                .execute()
        }

        if !remoteSales.isEmpty {
            try await writeClient
                .from("sales")
                .upsert(remoteSales)
                .execute()
        }

        if !remoteClients.isEmpty {
            try await writeClient
                .from("dealer_clients")
                .upsert(remoteClients)
                .execute()
        }
    }

    private func makeRemoteFinancialAccount(from account: FinancialAccount, dealerId: UUID) -> RemoteFinancialAccount? {
        guard let id = account.id else { return nil }
        let balanceDecimal = account.balance?.decimalValue ?? 0
        let updatedAt = account.updatedAt ?? Date()
        let type = account.accountType ?? "Account"
        return RemoteFinancialAccount(
            id: id,
            dealerId: dealerId,
            accountType: type,
            balance: balanceDecimal,
            updatedAt: updatedAt
        )
    }

    private func makeRemoteTemplate(from template: ExpenseTemplate, dealerId: UUID) -> RemoteExpenseTemplate? {
        guard let id = template.id else { return nil }
        let name = template.name ?? "Template"
        let category = template.category ?? ""
        let defaultAmount = template.defaultAmount?.decimalValue
        return RemoteExpenseTemplate(
            id: id,
            dealerId: dealerId,
            name: name,
            category: category,
            defaultDescription: template.defaultDescription,
            defaultAmount: defaultAmount
        )
    }



    private static func formatDateOnly(_ date: Date) -> String {
        dateOnlyFormatter.string(from: date)
    }

    private func makeRemoteVehicle(from vehicle: Vehicle, dealerId: UUID) -> RemoteVehicle? {
        guard let id = vehicle.id else { return nil }
        let year = vehicle.year == 0 ? nil : Int(vehicle.year)
        let purchaseDate = vehicle.purchaseDate ?? Date()
        let saleDateString = vehicle.saleDate.map { Self.formatDateOnly($0) }
        // For now we don't persist photo URL locally. Cloud image is derived from dealer & vehicle ids.
        return RemoteVehicle(
            id: id,
            dealerId: dealerId,
            vin: vehicle.vin ?? "",
            make: vehicle.make,
            model: vehicle.model,
            year: year,
            purchasePrice: (vehicle.purchasePrice as Decimal?) ?? 0,
            purchaseDate: Self.formatDateOnly(purchaseDate),
            status: vehicle.status ?? "on_sale",
            notes: vehicle.notes,
            createdAt: vehicle.createdAt ?? Date(),
            salePrice: vehicle.salePrice as Decimal?,
            saleDate: saleDateString,
            photoURL: nil
        )
    }

    private func makeRemoteExpense(from expense: Expense, dealerId: UUID) -> RemoteExpense? {
        guard let id = expense.id else { return nil }
        let date = expense.date ?? Date()
        return RemoteExpense(
            id: id,
            dealerId: dealerId,
            amount: (expense.amount as Decimal?) ?? 0,
            date: Self.formatDateOnly(date),
            expenseDescription: expense.expenseDescription,
            category: expense.category ?? "",
            createdAt: expense.createdAt ?? Date(),
            vehicleId: (expense.vehicle?.id),
            userId: (expense.user?.id),
            accountId: (expense.account?.id)
        )
    }

    private func makeRemoteSale(from sale: Sale, dealerId: UUID) -> RemoteSale? {
        guard
            let id = sale.id,
            let vehicle = sale.vehicle,
            let vehicleId = vehicle.id
        else { return nil }

        let date = sale.date ?? Date()
        return RemoteSale(
            id: id,
            dealerId: dealerId,
            vehicleId: vehicleId,
            amount: (sale.amount as Decimal?) ?? 0,
            date: Self.formatDateOnly(date),
            buyerName: sale.buyerName,
            buyerPhone: sale.buyerPhone,
            paymentMethod: sale.paymentMethod,
            createdAt: Date()
        )
    }

    private func makeRemoteClient(from client: Client, dealerId: UUID) -> RemoteClient? {
        guard let id = client.id else { return nil }
        return RemoteClient(
            id: id,
            dealerId: dealerId,
            name: client.name ?? "",
            phone: client.phone,
            email: client.email,
            notes: client.notes,
            requestDetails: client.requestDetails,
            preferredDate: client.preferredDate,
            createdAt: client.createdAt ?? Date(),
            status: client.status ?? "new",
            vehicleId: client.vehicle?.id
        )
    }
}

// MARK: - Sync Queue Manager

enum SyncOperationType: String, Codable {
    case upsert
    case delete
}

enum SyncEntityType: String, Codable {
    case vehicle
    case expense
    case sale
    case client
    case user
    case account
    case template
}

struct SyncQueueItem: Codable, Identifiable {
    let id: UUID
    let entityType: SyncEntityType
    let operation: SyncOperationType
    let payload: Data // JSON data of the entity
    let dealerId: UUID
    var retryCount: Int
    let createdAt: Date
    
    init(id: UUID = UUID(), entityType: SyncEntityType, operation: SyncOperationType, payload: Data, dealerId: UUID) {
        self.id = id
        self.entityType = entityType
        self.operation = operation
        self.payload = payload
        self.dealerId = dealerId
        self.retryCount = 0
        self.createdAt = Date()
    }
}

actor SyncQueueManager {
    static let shared = SyncQueueManager()
    
    private let queueFileName = "sync_queue.json"
    private var items: [SyncQueueItem] = []
    
    init() {
        loadQueue()
    }
    
    private var queueFileURL: URL? {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.appendingPathComponent(queueFileName)
    }
    
    private func loadQueue() {
        guard let url = queueFileURL, let data = try? Data(contentsOf: url) else { return }
        if let loaded = try? JSONDecoder().decode([SyncQueueItem].self, from: data) {
            self.items = loaded
        }
    }
    
    private func saveQueue() {
        guard let url = queueFileURL else { return }
        if let data = try? JSONEncoder().encode(items) {
            try? data.write(to: url)
        }
    }
    
    func enqueue(item: SyncQueueItem) {
        items.append(item)
        saveQueue()
    }
    
    func dequeue() -> SyncQueueItem? {
        guard !items.isEmpty else { return nil }
        let item = items.removeFirst()
        saveQueue()
        return item
    }
    
    func peek() -> SyncQueueItem? {
        items.first
    }
    
    func remove(id: UUID) {
        items.removeAll { $0.id == id }
        saveQueue()
    }
    
    func getAllItems() -> [SyncQueueItem] {
        items
    }
    
    func clear() {
        items.removeAll()
        saveQueue()
    }
    
    func itemCount() -> Int {
        items.count
    }
}
