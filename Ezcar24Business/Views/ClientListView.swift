import SwiftUI
import CoreData

enum ClientStatus: String, CaseIterable, Identifiable {
    case new
    case inProgress = "in_progress"
    case completed

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .new: return "New"
        case .inProgress: return "In Progress"
        case .completed: return "Completed"
        }
    }

    var sortOrder: Int {
        switch self {
        case .new: return 0
        case .inProgress: return 1
        case .completed: return 2
        }
    }

    var color: Color {
        switch self {
        case .new: return ColorTheme.primary
        case .inProgress: return ColorTheme.warning
        case .completed: return ColorTheme.success
        }
    }
}

extension Client {
    var clientStatus: ClientStatus {
        get { ClientStatus(rawValue: status ?? "new") ?? .new }
        set { status = newValue.rawValue }
    }
}


struct ClientListView: View {
    @StateObject private var viewModel = ClientViewModel()
    @Environment(\.managedObjectContext) private var context



    @State private var activeSheet: SheetType?
    @State private var showFilters = true
    @State private var dateFilter: DashboardTimeRange = .all
    
    enum SheetType: Identifiable {
        case new
        case edit(Client)
        
        var id: String {
            switch self {
            case .new: return "new"
            case .edit(let client): return client.objectID.uriRepresentation().absoluteString
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                if showFilters {
                    filtersBar
                        .transition(.move(edge: .top).combined(with: .opacity))
                }
                
                // Use native searchable if possible, but custom search bar allows more control over styling if needed.
                // Here we stick to the custom one but style it better.
                searchBar
                
                listContent
            }
            .background(ColorTheme.background.ignoresSafeArea())
            .navigationTitle("Clients")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        let newValue = !showFilters
                        withAnimation(.easeInOut) {
                            showFilters = newValue
                        }
                        if !newValue {
                            dateFilter = .all
                        }
                    } label: {
                        Label(
                            showFilters ? "Hide Filters" : "Filters",
                            systemImage: "line.3.horizontal.decrease.circle"
                        )
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        activeSheet = .new
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(item: $activeSheet) { item in
                switch item {
                case .new:
                    ClientDetailView(
                        client: nil,
                        context: context
                    ) { _ in
                        viewModel.fetchClients()
                    }
                case .edit(let client):
                    ClientDetailView(
                        client: client,
                        context: context
                    ) { _ in
                        viewModel.fetchClients()
                    }
                }
            }
        }
    }

    private var searchBar: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(ColorTheme.secondaryText)
            
            TextField("Search clients...", text: $viewModel.searchText)
                .textInputAutocapitalization(.never)
                .disableAutocorrection(true)
                .font(.subheadline)
            
            if !viewModel.searchText.isEmpty {
                Button {
                    viewModel.searchText = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(ColorTheme.secondaryText)
                        .font(.caption)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(ColorTheme.cardBackground)
        .cornerRadius(10)
        .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 12)
    }

    private var listContent: some View {
        let clients = visibleClients(applyDateFilter: showFilters)
        return Group {
            if clients.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "person.2.crop.square.stack")
                        .font(.system(size: 48))
                        .foregroundColor(ColorTheme.tertiaryText.opacity(0.5))
                    
                    VStack(spacing: 8) {
                        Text("No clients found")
                            .font(.headline)
                            .foregroundColor(ColorTheme.secondaryText)
                        Text("Tap + to add the first client")
                            .font(.subheadline)
                            .foregroundColor(ColorTheme.tertiaryText)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 12, pinnedViews: [.sectionHeaders]) {
                        if showFilters {
                            ForEach(groupedClientsByDate(clients), id: \.key) { bucket, bucketClients in
                                Section(header: dateHeader(for: bucket, count: bucketClients.count)) {
                                    ForEach(bucketClients, id: \.self) { client in
                                        clientRow(for: client)
                                    }
                                }
                            }
                        } else {
                            ForEach(ClientStatus.allCases) { status in
                                let sectionClients = clients.filter { $0.clientStatus == status }
                                if !sectionClients.isEmpty {
                                    Section(header: statusHeader(for: status)) {
                                        ForEach(sectionClients, id: \.self) { client in
                                            clientRow(for: client)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 20)
                }
            }
        }
    }

    private func statusHeader(for status: ClientStatus) -> some View {
        HStack(spacing: 6) {
            Circle()
                .fill(status.color)
                .frame(width: 8, height: 8)
            Text(status.displayName)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(ColorTheme.primaryText)
            Spacer()
        }
        .padding(.vertical, 8)
        .background(ColorTheme.background.opacity(0.95))
    }

    private func dateHeader(for bucket: String, count: Int) -> some View {
        HStack(spacing: 6) {
            Text(bucket)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(ColorTheme.primaryText)
            Spacer()
            Text("\(count)")
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(ColorTheme.secondaryText)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(Color.gray.opacity(0.1))
                .clipShape(Capsule())
        }
        .padding(.vertical, 8)
        .background(ColorTheme.background.opacity(0.95))
    }

    private func clientRow(for client: Client) -> some View {
        ClientRowView(
            client: client,
            onCall: { phone in call(phone) },
            onWhatsApp: { phone in whatsapp(phone) }
        )
        .onTapGesture {
            activeSheet = .edit(client)
        }
        // Swipe actions for quick communication (kept as alternative)
        .swipeActions(edge: .leading, allowsFullSwipe: true) {
            if let phone = client.phone, !phone.isEmpty {
                Button {
                    call(phone)
                } label: {
                    Label("Call", systemImage: "phone.fill")
                }
                .tint(.green)
                
                Button {
                    whatsapp(phone)
                } label: {
                    Label("WhatsApp", systemImage: "message.fill")
                }
                .tint(.green.opacity(0.8))
            }
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            Button(role: .destructive) {
                delete(client)
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
    }
    
    private func call(_ phone: String) {
        let clean = phone.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
        if let url = URL(string: "tel://\(clean)"), UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        }
    }
    
    private func whatsapp(_ phone: String) {
        let clean = phone.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
        if let url = URL(string: "https://wa.me/\(clean)"), UIApplication.shared.canOpenURL(url) {
            UIApplication.shared.open(url)
        }
    }

    private var filtersBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                Menu {
                    Button("All Time") { dateFilter = .all }
                    Button("Today") { dateFilter = .today }
                    Button("Last 7 Days") { dateFilter = .week }
                    Button("Last 30 Days") { dateFilter = .month }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "calendar")
                            .font(.caption)
                        Text(dateFilterTitle)
                            .font(.footnote)
                            .lineLimit(1)
                        Image(systemName: "chevron.down").font(.caption2).opacity(0.6)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .frame(minHeight: 28)
                    .foregroundColor(ColorTheme.secondaryText)
                    .background(Capsule().fill(Color.gray.opacity(0.1)))
                }

                Button {
                    dateFilter = .all
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.caption)
                        Text("Clear")
                            .font(.footnote)
                            .lineLimit(1)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .frame(minHeight: 28)
                    .foregroundColor(ColorTheme.secondaryText)
                    .background(Capsule().fill(Color.gray.opacity(0.1)))
                }
                .disabled(dateFilter == .all)
                .opacity(dateFilter == .all ? 0.6 : 1)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
        .background(ColorTheme.background)
    }

    private var dateFilterTitle: String {
        switch dateFilter {
        case .all: return "All Time"
        case .today: return "Today"
        case .week: return "Last 7 Days"
        case .month: return "Last 30 Days"
        }
    }

    private func visibleClients(applyDateFilter: Bool) -> [Client] {
        let searchFiltered = viewModel.filteredClients()
        let filtered = applyDateFilter ? searchFiltered.filter(matchesDateFilter) : searchFiltered
        if applyDateFilter {
            return filtered.sorted { ($0.createdAt ?? .distantPast) > ($1.createdAt ?? .distantPast) }
        }
        return filtered.sorted {
            if $0.clientStatus.sortOrder == $1.clientStatus.sortOrder {
                return ($0.createdAt ?? .distantPast) > ($1.createdAt ?? .distantPast)
            }
            return $0.clientStatus.sortOrder < $1.clientStatus.sortOrder
        }
    }

    private func groupedClientsByDate(_ clients: [Client]) -> [(key: String, items: [Client])] {
        let groups = Dictionary(grouping: clients) { client in
            dateBucket(for: client.createdAt)
        }

        func order(_ key: String) -> Int {
            switch key {
            case "Today": return 0
            case "Yesterday": return 1
            case "Last 7 Days": return 2
            case "Last 30 Days": return 3
            case "No Date": return 5
            default: return 4
            }
        }

        return groups
            .map { ($0.key, $0.value.sorted { ($0.createdAt ?? .distantPast) > ($1.createdAt ?? .distantPast) }) }
            .sorted { a, b in
                let oa = order(a.0)
                let ob = order(b.0)
                if oa != ob { return oa < ob }
                return a.0 < b.0
            }
    }

    private func matchesDateFilter(_ client: Client) -> Bool {
        guard showFilters else { return true }
        guard dateFilter != .all else { return true }
        guard let createdAt = client.createdAt else { return false }
        if let start = dateFilter.startDate, createdAt < start { return false }
        if let end = dateFilter.endDate, createdAt >= end { return false }
        return true
    }

    private func dateBucket(for date: Date?) -> String {
        guard let date else { return "No Date" }
        let cal = Calendar.current
        let now = Date()
        if cal.isDateInToday(date) { return "Today" }
        if cal.isDateInYesterday(date) { return "Yesterday" }
        if let seven = cal.date(byAdding: .day, value: -7, to: now), date >= seven { return "Last 7 Days" }
        if let thirty = cal.date(byAdding: .day, value: -30, to: now), date >= thirty { return "Last 30 Days" }
        return "Older"
    }


    private func delete(_ client: Client) {
        guard let dealerId = CloudSyncEnvironment.currentDealerId else { return }
        context.delete(client)
        do {
            try context.save()
            Task {
                await CloudSyncManager.shared?.deleteClient(client, dealerId: dealerId)
            }
            viewModel.fetchClients()
        } catch {
            print("Failed to delete client: \(error)")
            context.rollback()
        }
    }
}

struct ClientRowView: View {
    let client: Client
    
    // Quick Actions Handlers
    var onCall: ((String) -> Void)?
    var onWhatsApp: ((String) -> Void)?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                // Avatar / Initials
                ZStack {
                    Circle()
                        .fill(client.clientStatus.color.opacity(0.1))
                        .frame(width: 50, height: 50)
                    
                    Text(initials)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(client.clientStatus.color)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    // Name and Status
                    HStack {
                        Text(client.name ?? "No name")
                            .font(.headline)
                            .foregroundColor(ColorTheme.primaryText)
                            .lineLimit(1)
                        
                        Spacer()
                        
                        statusBadge
                    }
                    
                    // Primary Info (Vehicle or Request)
                    HStack(spacing: 6) {
                        Image(systemName: "car.fill")
                            .font(.caption)
                            .foregroundColor(ColorTheme.secondaryText)
                        
                        Text(primaryInterestText)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(ColorTheme.primaryText)
                            .lineLimit(1)
                    }
                    .padding(.top, 2)
                    
                    // Secondary Info (Activity / Reminder)
                    HStack(spacing: 6) {
                        Image(systemName: activityIcon)
                            .font(.caption)
                            .foregroundColor(activityColor)
                        
                        Text(activityText)
                            .font(.caption)
                            .foregroundColor(ColorTheme.secondaryText)
                            .lineLimit(1)
                    }
                }
            }
            
            // Quick Actions Footer
            if let phone = client.phone, !phone.isEmpty {
                Divider()
                    .padding(.top, 4)
                
                HStack {
                    Button {
                        onCall?(phone)
                    } label: {
                        Label("Call", systemImage: "phone.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundColor(ColorTheme.primaryText)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(ColorTheme.secondaryBackground)
                            .cornerRadius(8)
                    }
                    .buttonStyle(PlainButtonStyle()) 
                    
                    Button {
                        onWhatsApp?(phone)
                    } label: {
                        Label("WhatsApp", systemImage: "message.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundColor(ColorTheme.success)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(ColorTheme.success.opacity(0.1))
                            .cornerRadius(8)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
        .padding(16)
        .background(ColorTheme.cardBackground)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
    
    // MARK: - Computed Properties
    
    private var initials: String {
        let name = client.name ?? ""
        let components = name.components(separatedBy: .whitespacesAndNewlines).filter { !$0.isEmpty }
        if let first = components.first?.first {
            if components.count > 1, let last = components.last?.first {
                return "\(first)\(last)".uppercased()
            }
            return "\(first)".uppercased()
        }
        return "?"
    }
    
    private var statusBadge: some View {
        Text(client.clientStatus.displayName)
            .font(.caption2)
            .fontWeight(.bold)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(client.clientStatus.color.opacity(0.1))
            .foregroundColor(client.clientStatus.color)
            .clipShape(Capsule())
    }
    
    private var primaryInterestText: String {
        if let vehicle = client.vehicle {
            return vehicle.displayName
        }
        if let request = client.requestDetails, !request.isEmpty {
            return request
        }
        return "No specific interest"
    }
    
    private var activityIcon: String {
        if client.nextReminder != nil {
            return "bell.fill"
        }
        if client.lastInteraction != nil {
            return "clock.arrow.circlepath"
        }
        return "calendar"
    }
    
    private var activityColor: Color {
        if let reminder = client.nextReminder {
            return reminder.statusColor
        }
        return ColorTheme.secondaryText
    }
    
    private var activityText: String {
        if let reminder = client.nextReminder {
            let dateStr = shortDateFormatter.string(from: reminder.dueDate ?? Date())
            return "Reminder: \(reminder.title ?? "Task") • \(dateStr)"
        }
        if let interaction = client.lastInteraction {
            let dateStr = timeAgoFormatter.string(for: interaction.occurredAt) ?? "recently"
            return "Last contact: \(dateStr)"
        }
        let createdStr = shortDateFormatter.string(from: client.createdAt ?? Date())
        return "Added on \(createdStr)"
    }
    
    private var shortDateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        return formatter
    }
    
    private var timeAgoFormatter: RelativeDateTimeFormatter {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter
    }
}



extension Vehicle {
    var displayName: String {
        let make = make?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let model = model?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let name = [make, model].filter { !$0.isEmpty }.joined(separator: " ")
        if !name.isEmpty { return name }
        if let vin = vin?.trimmingCharacters(in: .whitespacesAndNewlines), !vin.isEmpty {
            return vin
        }
        return "Vehicle"
    }
}
