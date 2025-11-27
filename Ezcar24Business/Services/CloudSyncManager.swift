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

        let dealerId = user.id
        let since = lastSyncTimestamp
        
        // Create a background context for heavy lifting
        let bgContext = PersistenceController.shared.container.newBackgroundContext()
        bgContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        
        let writeClient = self.writeClient
        
        do {
            // 1. Flush any queued offline operations first (Main Actor is fine for this as it's usually small)
            await processOfflineQueue(dealerId: dealerId)

            // Pending deletes should block resurrection during this sync
            let pendingVehicleDeletes = await pendingVehicleDeleteIds()

            // Perform heavy sync logic on background context
            // 2. Push local changes - DISABLED to prevent zombie objects.
            // We rely on processOfflineQueue to push only actual changes.
            // try await self.pushLocalChanges(context: bgContext, dealerId: dealerId, writeClient: writeClient, skippingVehicleIds: pendingVehicleDeletes)
            
            // 3. Fetch remote changes (Network is async, doesn't block context)
            let snapshot = try await fetchRemoteChanges(dealerId: dealerId, since: since)
            let filteredSnapshot = filterSnapshot(snapshot, skippingVehicleIds: pendingVehicleDeletes)

            // 4. Ensure default accounts exist remotely if none locally
            let localAccountCount = try await bgContext.perform {
                try bgContext.count(for: FinancialAccount.fetchRequest())
            }
            let accountsForMerge: [RemoteFinancialAccount]
            if localAccountCount == 0 {
                accountsForMerge = await self.ensureDefaultAccounts(context: bgContext, for: dealerId, existingAccounts: filteredSnapshot.accounts, writeClient: writeClient)
            } else {
                accountsForMerge = filteredSnapshot.accounts
            }
            let snapshotForMerge = RemoteSnapshot(
                users: filteredSnapshot.users,
                accounts: accountsForMerge,
                vehicles: filteredSnapshot.vehicles,
                templates: filteredSnapshot.templates,
                expenses: filteredSnapshot.expenses,
                sales: filteredSnapshot.sales,
                clients: filteredSnapshot.clients
            )
            
            try await bgContext.perform {
                // 5. Smart Merge
                try self.mergeRemoteChanges(snapshotForMerge, context: bgContext, dealerId: dealerId)
            }
            
            // 6. Update timestamp (Main Actor)
            lastSyncTimestamp = Date()
            lastSyncAt = lastSyncTimestamp
            
            // 7. Background tasks
            Task { [weak self] in
                await self?.downloadVehicleImages(dealerId: dealerId, vehicles: filteredSnapshot.vehicles)
            }
            
            if isFirstSync {
                syncHUDState = .success
                scheduleHideHUD(for: .success)
            }
            
            // 8. Process offline queue again
            await processOfflineQueue(dealerId: dealerId)
            
        } catch {

            // Ignore cancellation errors
            if error is CancellationError {
                return
            }
            if let urlError = error as? URLError, urlError.code == .cancelled {
                return
            }
            if (error as NSError).domain == NSURLErrorDomain && (error as NSError).code == NSURLErrorCancelled {
                return
            }
            
            print("CloudSyncManager sync error: \(error)")
            if isFirstSync {
                syncHUDState = .failure
                scheduleHideHUD(for: .failure)
            }
            showError("Sync failed: \(error.localizedDescription)")
        }
    }

    func manualSync(user: Auth.User) async {
        // Force a sync even if one happened recently, but respect isSyncing lock
        await syncAfterLogin(user: user)
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
    
    func processOfflineQueue(dealerId: UUID) async {
        let items = await SyncQueueManager.shared.getAllItems()
        guard !items.isEmpty else { return }
        
        for item in items {
            // Filter by dealerId to prevent cross-user data leaks
            guard item.dealerId == dealerId else { continue }
            
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

    private func pendingVehicleDeleteIds() async -> Set<UUID> {
        let items = await SyncQueueManager.shared.getAllItems()
        let decoder = JSONDecoder()
        var ids: Set<UUID> = []
        for item in items {
            guard item.entityType == .vehicle, item.operation == .delete else { continue }
            if let id = try? decoder.decode(UUID.self, from: item.payload) {
                ids.insert(id)
            }
        }
        return ids
    }

    private func processUpsert(_ item: SyncQueueItem) async throws {
        let decoder = JSONDecoder()
        switch item.entityType {
        case .vehicle:
            let remote = try decoder.decode(RemoteVehicle.self, from: item.payload)
            try await writeClient.from("crm_vehicles").upsert(remote).execute()
        case .expense:
            let remote = try decoder.decode(RemoteExpense.self, from: item.payload)
            try await writeClient.from("crm_expenses").upsert(remote).execute()
        case .sale:
            let remote = try decoder.decode(RemoteSale.self, from: item.payload)
            try await writeClient.from("crm_sales").upsert(remote).execute()
        case .client:
            let remote = try decoder.decode(RemoteClient.self, from: item.payload)
            try await writeClient.from("crm_dealer_clients").upsert(remote).execute()
        case .user:
            let remote = try decoder.decode(RemoteDealerUser.self, from: item.payload)
            try await writeClient.from("crm_dealer_users").upsert(remote).execute()
        case .account:
             let remote = try decoder.decode(RemoteFinancialAccount.self, from: item.payload)
             try await writeClient.from("crm_financial_accounts").upsert(remote).execute()
        case .template:
             let remote = try decoder.decode(RemoteExpenseTemplate.self, from: item.payload)
             try await writeClient.from("crm_expense_templates").upsert(remote).execute()
        }
    }

    private func processDelete(_ item: SyncQueueItem) async throws {
        let decoder = JSONDecoder()
        let id = try decoder.decode(UUID.self, from: item.payload)
        let table: String
        switch item.entityType {
        case .vehicle: table = "crm_vehicles"
        case .expense: table = "crm_expenses"
        case .sale: table = "crm_sales"
        case .client: table = "crm_dealer_clients"
        case .user: table = "crm_dealer_users"
        case .account: table = "crm_financial_accounts"
        case .template: table = "crm_expense_templates"
        }
        var deleteBuilder = writeClient.from(table).delete().eq("id", value: id)
        // Add dealer_id guard for multi-tenant tables
        switch item.entityType {
        case .vehicle, .expense, .sale, .client, .user, .account, .template:
            deleteBuilder = deleteBuilder.eq("dealer_id", value: item.dealerId)
        }
        try await deleteBuilder.execute()
    }

    func upsertVehicle(_ vehicle: Vehicle, dealerId: UUID) async {
        guard let remote = makeRemoteVehicle(from: vehicle, dealerId: dealerId) else { return }
        
        // Instant Sync: Fire and forget
        Task {
            do {
                try await writeClient
                    .from("crm_vehicles")
                    .upsert(remote)
                    .execute()
                await processOfflineQueue(dealerId: dealerId)
            } catch {
                print("CloudSyncManager upsertVehicle error: \(error)")
                showError("Saved locally. Will sync when online.")
                if let data = try? JSONEncoder().encode(remote) {
                    let item = SyncQueueItem(entityType: .vehicle, operation: .upsert, payload: data, dealerId: dealerId)
                    await SyncQueueManager.shared.enqueue(item: item)
                }
            }
        }
    }

    func deleteVehicle(_ vehicle: Vehicle, dealerId: UUID) async {
        guard let id = vehicle.id else { return }
        await deleteVehicle(id: id, dealerId: dealerId)
    }

    func deleteVehicle(id: UUID, dealerId: UUID) async {
        let queuedDeleteId: UUID?
        if let data = try? JSONEncoder().encode(id) {
            let item = SyncQueueItem(entityType: .vehicle, operation: .delete, payload: data, dealerId: dealerId)
            await SyncQueueManager.shared.enqueue(item: item)
            queuedDeleteId = item.id
        } else {
            queuedDeleteId = nil
        }

        do {
            try await writeClient
                .from("crm_vehicles")
                .delete()
                .eq("id", value: id)
                .eq("dealer_id", value: dealerId)
                .execute()
            // Also remove image from cloud storage (best-effort).
            await deleteVehicleImage(vehicleId: id, dealerId: dealerId)
            if let queuedDeleteId {
                await SyncQueueManager.shared.remove(id: queuedDeleteId)
            }
            await processOfflineQueue(dealerId: dealerId)
        } catch {
            print("CloudSyncManager deleteVehicle error: \(error)")
            showError("Deleted locally. Will sync when online.")
            // Leave the queued delete in place so it gets replayed on the next sync
        }
    }

    func upsertExpense(_ expense: Expense, dealerId: UUID) async {
        guard let remote = makeRemoteExpense(from: expense, dealerId: dealerId) else { return }
        
        Task {
            do {
                try await writeClient
                    .from("crm_expenses")
                    .upsert(remote)
                    .execute()
                await processOfflineQueue(dealerId: dealerId)
            } catch {
                print("CloudSyncManager upsertExpense error: \(error)")
                showError("Saved locally. Will sync when online.")
                if let data = try? JSONEncoder().encode(remote) {
                    let item = SyncQueueItem(entityType: .expense, operation: .upsert, payload: data, dealerId: dealerId)
                    await SyncQueueManager.shared.enqueue(item: item)
                }
            }
        }
    }

    func deleteExpense(_ expense: Expense, dealerId: UUID) async {
        guard let id = expense.id else { return }
        await deleteExpense(id: id, dealerId: dealerId)
    }

    func deleteExpense(id: UUID, dealerId: UUID) async {
        let queuedDeleteId: UUID?
        if let data = try? JSONEncoder().encode(id) {
            let item = SyncQueueItem(entityType: .expense, operation: .delete, payload: data, dealerId: dealerId)
            await SyncQueueManager.shared.enqueue(item: item)
            queuedDeleteId = item.id
        } else {
            queuedDeleteId = nil
        }
        
        do {
            try await writeClient
                .from("crm_expenses")
                .delete()
                .eq("id", value: id)
                .eq("dealer_id", value: dealerId)
                .execute()
            if let queuedDeleteId {
                await SyncQueueManager.shared.remove(id: queuedDeleteId)
            }
            await processOfflineQueue(dealerId: dealerId)
        } catch {
            print("CloudSyncManager deleteExpense error: \(error)")
            showError("Deleted locally. Will sync when online.")
        }
    }

    func upsertSale(_ sale: Sale, dealerId: UUID) async {
        guard let remote = makeRemoteSale(from: sale, dealerId: dealerId) else { return }
        
        Task {
            do {
                try await writeClient
                    .from("crm_sales")
                    .upsert(remote)
                    .execute()
                await processOfflineQueue(dealerId: dealerId)
            } catch {
                print("CloudSyncManager upsertSale error: \(error)")
                showError("Saved locally. Will sync when online.")
                if let data = try? JSONEncoder().encode(remote) {
                    let item = SyncQueueItem(entityType: .sale, operation: .upsert, payload: data, dealerId: dealerId)
                    await SyncQueueManager.shared.enqueue(item: item)
                }
            }
        }
    }

    func deleteSale(_ sale: Sale, dealerId: UUID) async {
        guard let id = sale.id else { return }
        
        Task {
            do {
                try await writeClient
                    .from("crm_sales")
                    .delete()
                    .eq("id", value: id)
                    .eq("dealer_id", value: dealerId)
                    .execute()
                await processOfflineQueue(dealerId: dealerId)
            } catch {
                print("CloudSyncManager deleteSale error: \(error)")
                showError("Deleted locally. Will sync when online.")
                if let data = try? JSONEncoder().encode(id) {
                    let item = SyncQueueItem(entityType: .sale, operation: .delete, payload: data, dealerId: dealerId)
                    await SyncQueueManager.shared.enqueue(item: item)
                }
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
        
        Task {
            do {
                try await writeClient
                    .from("crm_dealer_users")
                    .upsert(remote)
                    .execute()
                await processOfflineQueue(dealerId: dealerId)
            } catch {
                print("CloudSyncManager upsertUser error: \(error)")
                showError("Saved locally. Will sync when online.")
                if let data = try? JSONEncoder().encode(remote) {
                    let item = SyncQueueItem(entityType: .user, operation: .upsert, payload: data, dealerId: dealerId)
                    await SyncQueueManager.shared.enqueue(item: item)
                }
            }
        }
    }

    func deleteUser(_ user: User, dealerId: UUID) async {
        guard let id = user.id else { return }
        
        Task {
            do {
                try await writeClient
                    .from("crm_dealer_users")
                    .delete()
                    .eq("id", value: id)
                    .eq("dealer_id", value: dealerId)
                    .execute()
                await processOfflineQueue(dealerId: dealerId)
            } catch {
                print("CloudSyncManager deleteUser error: \(error)")
                showError("Deleted locally. Will sync when online.")
                if let data = try? JSONEncoder().encode(id) {
                    let item = SyncQueueItem(entityType: .user, operation: .delete, payload: data, dealerId: dealerId)
                    await SyncQueueManager.shared.enqueue(item: item)
                }
            }
        }
    }

    func upsertClient(_ clientObject: Client, dealerId: UUID) async {
        guard let remote = makeRemoteClient(from: clientObject, dealerId: dealerId) else { return }
        
        Task {
            do {
                try await writeClient
                    .from("crm_dealer_clients")
                    .upsert(remote)
                    .execute()
                await processOfflineQueue(dealerId: dealerId)
            } catch {
                print("CloudSyncManager upsertClient error: \(error)")
                showError("Saved locally. Will sync when online.")
                if let data = try? JSONEncoder().encode(remote) {
                    let item = SyncQueueItem(entityType: .client, operation: .upsert, payload: data, dealerId: dealerId)
                    await SyncQueueManager.shared.enqueue(item: item)
                }
            }
        }
    }

    func deleteClient(_ clientObject: Client, dealerId: UUID) async {
        guard let id = clientObject.id else { return }
        await deleteClient(id: id, dealerId: dealerId)
    }

    func deleteClient(id: UUID, dealerId: UUID) async {
        let queuedDeleteId: UUID?
        if let data = try? JSONEncoder().encode(id) {
            let item = SyncQueueItem(entityType: .client, operation: .delete, payload: data, dealerId: dealerId)
            await SyncQueueManager.shared.enqueue(item: item)
            queuedDeleteId = item.id
        } else {
            queuedDeleteId = nil
        }
        
        do {
            try await writeClient
                .from("crm_dealer_clients")
                .delete()
                .eq("id", value: id)
                .eq("dealer_id", value: dealerId)
                .execute()
            if let queuedDeleteId {
                await SyncQueueManager.shared.remove(id: queuedDeleteId)
            }
            await processOfflineQueue(dealerId: dealerId)
        } catch {
            print("CloudSyncManager deleteClient error: \(error)")
            showError("Deleted locally. Will sync when online.")
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
        @Sendable
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
        async let users: [RemoteDealerUser] = query("crm_dealer_users", useUpdatedAt: true)
        async let accounts: [RemoteFinancialAccount] = query("crm_financial_accounts", useUpdatedAt: true)
        async let vehicles: [RemoteVehicle] = query("crm_vehicles", useUpdatedAt: false)
        async let templates: [RemoteExpenseTemplate] = query("crm_expense_templates", useUpdatedAt: false)
        async let expenses: [RemoteExpense] = query("crm_expenses", useUpdatedAt: false)
        async let sales: [RemoteSale] = query("crm_sales", useUpdatedAt: false)
        async let clients: [RemoteClient] = query("crm_dealer_clients", useUpdatedAt: false)

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

    private func filterSnapshot(_ snapshot: RemoteSnapshot, skippingVehicleIds: Set<UUID>) -> RemoteSnapshot {
        guard !skippingVehicleIds.isEmpty else { return snapshot }
        
        let filteredVehicles = snapshot.vehicles.filter { !skippingVehicleIds.contains($0.id) }
        let filteredExpenses = snapshot.expenses.filter { expense in
            guard let vId = expense.vehicleId else { return true }
            return !skippingVehicleIds.contains(vId)
        }
        let filteredSales = snapshot.sales.filter { sale in
            !skippingVehicleIds.contains(sale.vehicleId)
        }
        let filteredClients = snapshot.clients.filter { client in
            guard let vId = client.vehicleId else { return true }
            return !skippingVehicleIds.contains(vId)
        }
        
        return RemoteSnapshot(
            users: snapshot.users,
            accounts: snapshot.accounts,
            vehicles: filteredVehicles,
            templates: snapshot.templates,
            expenses: filteredExpenses,
            sales: filteredSales,
            clients: filteredClients
        )
    }

    // Ensure that each dealer has at least a couple of basic accounts so that
    // the Add Expense screen never shows an empty list.
    nonisolated private func ensureDefaultAccounts(context _: NSManagedObjectContext, for dealerId: UUID, existingAccounts: [RemoteFinancialAccount], writeClient: SupabaseClient) async -> [RemoteFinancialAccount] {
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
                .from("crm_financial_accounts")
                .insert(newAccounts)
                .execute()
        } catch {
            // If insert fails, log but still return the locally constructed defaults
            // so that the UI can work with accounts in this session.
            print("CloudSyncManager ensureDefaultAccounts insert error: \(error)")
        }

        return newAccounts
    }

    // MARK: - Merge Logic
    
    nonisolated private func mergeRemoteChanges(_ snapshot: RemoteSnapshot, context: NSManagedObjectContext, dealerId: UUID) throws {
        // Helpers for fetching existing objects
        func fetchExisting<T: NSManagedObject>(entityName: String, ids: [UUID]) -> [UUID: T] {
            let request = NSFetchRequest<T>(entityName: entityName)
            request.predicate = NSPredicate(format: "id IN %@", ids)
            do {
                let results = try context.fetch(request)
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
            if let d = CloudSyncManager.parseDateOnly(v.purchaseDate) {
                obj.purchaseDate = d
            } else {
                obj.purchaseDate = v.createdAt
            }
            obj.status = v.status
            obj.notes = v.notes
            obj.createdAt = v.createdAt
            if let salePrice = v.salePrice { obj.salePrice = NSDecimalNumber(decimal: salePrice) }
            if let saleDateString = v.saleDate, let saleDate = CloudSyncManager.parseDateOnly(saleDateString) {
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
                if let d = CloudSyncManager.parseDateOnly(e.date) {
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
                if let d = CloudSyncManager.parseDateOnly(s.date) {
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

            // Remove local objects that no longer exist remotely (to reflect deletions/dedup)
            func deleteMissing(_ entityName: String, keepIds: [UUID]) {
                let request = NSFetchRequest<NSManagedObject>(entityName: entityName)
                do {
                    let all = try context.fetch(request)
                    let keepSet = Set(keepIds)
                    for obj in all {
                        if let id = obj.value(forKey: "id") as? UUID, !keepSet.contains(id) {
                            context.delete(obj)
                        }
                    }
                } catch {
                    print("Error deleting missing \(entityName): \(error)")
                }
            }
            
            deleteMissing("User", keepIds: snapshot.users.map { $0.id })
            deleteMissing("FinancialAccount", keepIds: snapshot.accounts.map { $0.id })
            deleteMissing("Vehicle", keepIds: snapshot.vehicles.map { $0.id })
            deleteMissing("ExpenseTemplate", keepIds: snapshot.templates.map { $0.id })
            deleteMissing("Expense", keepIds: snapshot.expenses.map { $0.id })
            deleteMissing("Sale", keepIds: snapshot.sales.map { $0.id })
            deleteMissing("Client", keepIds: snapshot.clients.map { $0.id })

            if context.hasChanges {
                try context.save()
            }
        }

    // MARK: - Mapping helpers

    nonisolated private static func parseDateOnly(_ string: String) -> Date? {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(secondsFromGMT: 0)
        f.dateFormat = "yyyy-MM-dd"
        return f.date(from: string)
    }
    // Push local Core Data state to Supabase so we don't lose offline changes when applying a remote snapshot.
    nonisolated private func pushLocalChanges(context: NSManagedObjectContext, dealerId: UUID, writeClient: SupabaseClient, skippingVehicleIds: Set<UUID> = []) async throws {
        let payload = try await context.perform { [self] () throws -> (users: [RemoteDealerUser], accounts: [RemoteFinancialAccount], vehicles: [RemoteVehicle], expenses: [RemoteExpense], sales: [RemoteSale], clients: [RemoteClient], templates: [RemoteExpenseTemplate]) in
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
            let vehicles = try context
                .fetch(vehicleRequest)
                .filter { vehicle in
                    guard let id = vehicle.id else { return true }
                    return !skippingVehicleIds.contains(id)
                }
            let expenses = try context
                .fetch(expenseRequest)
                .filter { expense in
                    guard let vId = expense.vehicle?.id else { return true }
                    return !skippingVehicleIds.contains(vId)
                }
            let sales = try context
                .fetch(saleRequest)
                .filter { sale in
                    guard let vId = sale.vehicle?.id else { return true }
                    return !skippingVehicleIds.contains(vId)
                }
            let clients = try context
                .fetch(clientRequest)
                .filter { client in
                    guard let vId = client.vehicle?.id else { return true }
                    return !skippingVehicleIds.contains(vId)
                }
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
                self.makeRemoteFinancialAccount(from: account, dealerId: dealerId)
            }

            let remoteVehicles: [RemoteVehicle] = vehicles.compactMap { vehicle in
                self.makeRemoteVehicle(from: vehicle, dealerId: dealerId)
            }

            let remoteExpenses: [RemoteExpense] = expenses.compactMap { expense in
                self.makeRemoteExpense(from: expense, dealerId: dealerId)
            }

            let remoteSales: [RemoteSale] = sales.compactMap { sale in
                self.makeRemoteSale(from: sale, dealerId: dealerId)
            }

            let remoteClients: [RemoteClient] = clients.compactMap { client in
                self.makeRemoteClient(from: client, dealerId: dealerId)
            }

            let remoteTemplates: [RemoteExpenseTemplate] = templates.compactMap { template in
                self.makeRemoteTemplate(from: template, dealerId: dealerId)
            }

            return (
                users: remoteUsers,
                accounts: remoteAccounts,
                vehicles: remoteVehicles,
                expenses: remoteExpenses,
                sales: remoteSales,
                clients: remoteClients,
                templates: remoteTemplates
            )
        }

        // Push to Supabase. If any of these throws, we fail the sync rather than wiping local data.
        // Push to Supabase. If any of these throws, we fail the sync rather than wiping local data.
        // Push to Supabase using RPCs to handle upserts on views
        if !payload.users.isEmpty {
            try await writeClient
                .rpc("upsert_crm_dealer_users", params: ["payload": payload.users])
                .execute()
        }

        if !payload.accounts.isEmpty {
            try await writeClient
                .rpc("upsert_crm_financial_accounts", params: ["payload": payload.accounts])
                .execute()
        }

        if !payload.vehicles.isEmpty {
            try await writeClient
                .rpc("upsert_crm_vehicles", params: ["payload": payload.vehicles])
                .execute()
        }

        if !payload.templates.isEmpty {
            try await writeClient
                .rpc("upsert_crm_expense_templates", params: ["payload": payload.templates])
                .execute()
        }

        if !payload.expenses.isEmpty {
            try await writeClient
                .rpc("upsert_crm_expenses", params: ["payload": payload.expenses])
                .execute()
        }

        if !payload.sales.isEmpty {
            try await writeClient
                .rpc("upsert_crm_sales", params: ["payload": payload.sales])
                .execute()
        }

        if !payload.clients.isEmpty {
            try await writeClient
                .rpc("upsert_crm_dealer_clients", params: ["payload": payload.clients])
                .execute()
        }
    }

    nonisolated private func makeRemoteFinancialAccount(from account: FinancialAccount, dealerId: UUID) -> RemoteFinancialAccount? {
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

    nonisolated private func makeRemoteTemplate(from template: ExpenseTemplate, dealerId: UUID) -> RemoteExpenseTemplate? {
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



    nonisolated private static func formatDateOnly(_ date: Date) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(secondsFromGMT: 0)
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    nonisolated private func makeRemoteVehicle(from vehicle: Vehicle, dealerId: UUID) -> RemoteVehicle? {
        guard let id = vehicle.id else { return nil }
        let year = vehicle.year == 0 ? nil : Int(vehicle.year)
        let purchaseDate = vehicle.purchaseDate ?? Date()
        let saleDateString = vehicle.saleDate.map { CloudSyncManager.formatDateOnly($0) }
        // For now we don't persist photo URL locally. Cloud image is derived from dealer & vehicle ids.
        return RemoteVehicle(
            id: id,
            dealerId: dealerId,
            vin: vehicle.vin ?? "",
            make: vehicle.make,
            model: vehicle.model,
            year: year,
            purchasePrice: (vehicle.purchasePrice as Decimal?) ?? 0,
            purchaseDate: CloudSyncManager.formatDateOnly(purchaseDate),
            status: vehicle.status ?? "on_sale",
            notes: vehicle.notes,
            createdAt: vehicle.createdAt ?? Date(),
            salePrice: vehicle.salePrice as Decimal?,
            saleDate: saleDateString,
            photoURL: nil
        )
    }

    nonisolated private func makeRemoteExpense(from expense: Expense, dealerId: UUID) -> RemoteExpense? {
        guard let id = expense.id else { return nil }
        let date = expense.date ?? Date()
        return RemoteExpense(
            id: id,
            dealerId: dealerId,
            amount: (expense.amount as Decimal?) ?? 0,
            date: CloudSyncManager.formatDateOnly(date),
            expenseDescription: expense.expenseDescription,
            category: expense.category ?? "",
            createdAt: expense.createdAt ?? Date(),
            vehicleId: (expense.vehicle?.id),
            userId: (expense.user?.id),
            accountId: (expense.account?.id)
        )
    }

    nonisolated private func makeRemoteSale(from sale: Sale, dealerId: UUID) -> RemoteSale? {
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
            date: CloudSyncManager.formatDateOnly(date),
            buyerName: sale.buyerName,
            buyerPhone: sale.buyerPhone,
            paymentMethod: sale.paymentMethod,
            createdAt: Date()
        )
    }

    nonisolated private func makeRemoteClient(from client: Client, dealerId: UUID) -> RemoteClient? {
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
    // MARK: - Deduplication

    func deduplicateData(dealerId: UUID) async throws {
        do {
            // 1. Deduplicate Vehicles by VIN
            // Fetch all vehicles for this dealer
            let vehicles: [RemoteVehicle] = try await client
                .from("crm_vehicles")
                .select()
                .eq("dealer_id", value: dealerId)
                .execute()
                .value
            
            // Group by VIN
            let groupedVehicles = Dictionary(grouping: vehicles, by: { $0.vin })
            
            for (vin, group) in groupedVehicles {
                if group.count > 1 {
                    // Keep the most recently created one
                    let sorted = group.sorted { $0.createdAt > $1.createdAt }
                    let toDelete = sorted.dropFirst()
                    
                    for v in toDelete {
                        print("Deleting duplicate vehicle VIN: \(vin), ID: \(v.id)")
                        do {
                            try await writeClient
                                .from("crm_vehicles")
                                .delete()
                                .eq("id", value: v.id)
                                .execute()
                        } catch {
                            print("Failed to delete duplicate vehicle \(v.id): \(error)")
                        }
                    }
                }
            }
            
            // 2. Deduplicate Clients by Phone
            let clients: [RemoteClient] = try await client
                .from("crm_dealer_clients")
                .select()
                .eq("dealer_id", value: dealerId)
                .execute()
                .value
            
            let groupedClients = Dictionary(grouping: clients, by: { $0.phone })
            
            for (phone, group) in groupedClients {
                if group.count > 1 {
                    let sorted = group.sorted { $0.createdAt > $1.createdAt }
                    let toDelete = sorted.dropFirst()
                    
                    for c in toDelete {
                        let phoneLabel = phone ?? "nil"
                        print("Deleting duplicate client Phone: \(phoneLabel), ID: \(c.id)")
                        do {
                            try await writeClient
                                .from("crm_dealer_clients")
                                .delete()
                                .eq("id", value: c.id)
                                .execute()
                        } catch {
                            print("Failed to delete duplicate client \(c.id): \(error)")
                        }
                    }
                }
            }
            
            // 3. Deduplicate Financial Accounts by name/type (case/whitespace insensitive)
            let accounts: [RemoteFinancialAccount] = try await client
                .from("crm_financial_accounts")
                .select()
                .eq("dealer_id", value: dealerId)
                .execute()
                .value
            
            let groupedAccounts = Dictionary(grouping: accounts, by: { $0.accountType.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() })
            
            for (normalizedType, group) in groupedAccounts {
                if normalizedType.isEmpty { continue }
                if group.count > 1 {
                    let sorted = group.sorted { $0.updatedAt > $1.updatedAt }
                    let toDelete = sorted.dropFirst()
                    
                    for acc in toDelete {
                        print("Deleting duplicate account: \(acc.accountType), ID: \(acc.id)")
                        do {
                            try await writeClient
                                .from("crm_financial_accounts")
                                .delete()
                                .eq("id", value: acc.id)
                                .execute()
                        } catch {
                            print("Failed to delete duplicate account \(acc.id): \(error)")
                        }
                    }
                }
            }
            
            // 3. Deduplicate Users by name (case/whitespace insensitive)
            let users: [RemoteDealerUser] = try await client
                .from("crm_dealer_users")
                .select()
                .eq("dealer_id", value: dealerId)
                .execute()
                .value
            
            let groupedUsers = Dictionary(grouping: users, by: { $0.name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() })
            
            for (normalizedName, group) in groupedUsers {
                if normalizedName.isEmpty { continue }
                if group.count > 1 {
                    let sorted = group.sorted { $0.createdAt > $1.createdAt }
                    let toDelete = sorted.dropFirst()
                    
                    for u in toDelete {
                        print("Deleting duplicate user Name: \(u.name), ID: \(u.id)")
                        do {
                            try await writeClient
                                .from("crm_dealer_users")
                                .delete()
                                .eq("id", value: u.id)
                                .execute()
                        } catch {
                            print("Failed to delete duplicate user \(u.id): \(error)")
                        }
                    }
                }
            }
            
            // Refresh local cache after remote deletes
            let snapshot = try await fetchRemoteChanges(dealerId: dealerId, since: nil)
            try mergeRemoteChanges(snapshot, context: context, dealerId: dealerId)
        } catch {
            print("Deduplication error: \(error)")
            throw error
        }
    }

    // MARK: - Account Deletion Helper
    
    func deleteAllRemoteData(dealerId: UUID) async throws {
        // Delete in reverse order of dependencies to avoid FK constraints if cascades aren't set
        // Dependencies:
        // Expenses -> Vehicles, Accounts, Users
        // Sales -> Vehicles
        // Clients -> Vehicles
        // Vehicles -> Dealer
        // Accounts -> Dealer
        // Templates -> Dealer
        // DealerUsers -> Dealer
        
        // 1. Expenses
        try await writeClient.from("crm_expenses").delete().eq("dealer_id", value: dealerId).execute()
        
        // 2. Sales
        try await writeClient.from("crm_sales").delete().eq("dealer_id", value: dealerId).execute()
        
        // 3. Clients
        try await writeClient.from("crm_dealer_clients").delete().eq("dealer_id", value: dealerId).execute()
        
        // 4. Vehicles
        try await writeClient.from("crm_vehicles").delete().eq("dealer_id", value: dealerId).execute()
        
        // 5. Templates
        try await writeClient.from("crm_expense_templates").delete().eq("dealer_id", value: dealerId).execute()
        
        // 6. Financial Accounts
        try await writeClient.from("crm_financial_accounts").delete().eq("dealer_id", value: dealerId).execute()
        
        // 7. Dealer Users (The user profile itself in public table)
        try await writeClient.from("crm_dealer_users").delete().eq("dealer_id", value: dealerId).execute()
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
        Task {
            await loadQueue()
        }
    }
    
    private var queueFileURL: URL? {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.appendingPathComponent(queueFileName)
    }
    
    private func loadQueue() async {
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
