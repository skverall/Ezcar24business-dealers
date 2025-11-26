import SwiftUI
import UniformTypeIdentifiers


struct VehicleFilterMenu: View {
    @ObservedObject var viewModel: ExpenseViewModel
    private var title: String {
        if let v = viewModel.selectedVehicle {
            let make = v.make ?? ""
            let model = v.model ?? ""
            return "\(make) \(model)"
        } else {
            return "All"
        }
    }
    var body: some View {
        Menu {
            Button("All Vehicles") {
                viewModel.selectedVehicle = nil
                viewModel.fetchExpenses()
            }
            Divider()
            ForEach(Array(viewModel.vehicles.enumerated()), id: \.element.objectID) { _, vehicle in
                Button {
                    viewModel.selectedVehicle = vehicle
                    viewModel.fetchExpenses()
                } label: {
                    Text("\(vehicle.make ?? "") \(vehicle.model ?? "")")
                }
            }
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "car.fill")
                    .font(.caption)
                Text(title)
                    .font(.footnote)
                    .lineLimit(1)
                    .truncationMode(.tail)
                Image(systemName: "chevron.down")
                    .font(.caption2)
                    .opacity(0.6)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .frame(minHeight: 28)
            .foregroundColor(ColorTheme.secondaryText)
            .background(Capsule().fill(Color.gray.opacity(0.1)))
            .contentShape(Capsule())
        }
    }
}

struct UserFilterMenu: View {
    @ObservedObject var viewModel: ExpenseViewModel
    private var title: String {
        viewModel.selectedUser == nil ? "All" : "\(viewModel.selectedUser?.name ?? "Selected")"
    }
    var body: some View {
        Menu {
            Button("All Users") {
                viewModel.selectedUser = nil
                viewModel.fetchExpenses()
            }
            Divider()
            ForEach(Array(viewModel.users.enumerated()), id: \.element.objectID) { _, user in
                Button {
                    viewModel.selectedUser = user
                    viewModel.fetchExpenses()
                } label: {
                    Text(user.name ?? "")
                }
            }
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "person.fill")
                    .font(.caption)
                Text(title)
                    .font(.footnote)
                    .lineLimit(1)
                    .truncationMode(.tail)
                Image(systemName: "chevron.down")
                    .font(.caption2)
                    .opacity(0.6)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .frame(minHeight: 28)
            .foregroundColor(ColorTheme.secondaryText)
            .background(Capsule().fill(Color.gray.opacity(0.1)))
            .contentShape(Capsule())
        }
    }
}

//
//  ExpenseListView.swift
//  Ezcar24Business
//
//  Expense tracking and listing
//

private struct CategoryBar: View {
    let ratio: CGFloat
    let color: Color
    @State private var animatedRatio: CGFloat = 0

    var body: some View {
        ZStack(alignment: .leading) {
            Capsule().fill(color.opacity(0.2))
            GeometryReader { gp in
                let fillWidth = gp.size.width * animatedRatio
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(color)
                        .frame(width: fillWidth, height: 8)
                    if fillWidth >= 36 { // show % only if width allows
                        Text("\(Int((ratio * 100).rounded()))%")
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 6)
                    }
                }
            }
        }
        .frame(height: 8)
        .frame(maxWidth: .infinity)
        .onAppear { withAnimation(.easeOut(duration: 0.6)) { animatedRatio = max(0.02, min(1, ratio)) } }
        .onChange(of: ratio) { _, newVal in
            withAnimation(.easeOut(duration: 0.6)) { animatedRatio = max(0.02, min(1, newVal)) }
        }
    }
}


struct ExpenseListView: View {
    private enum GroupMode: String, CaseIterable { case date, category }

    @StateObject private var viewModel: ExpenseViewModel
    @EnvironmentObject private var cloudSyncManager: CloudSyncManager
    @EnvironmentObject private var sessionStore: SessionStore
    
    @State private var showingAddExpense = false
    @State private var showingEdit = false
    @State private var editingExpense: Expense? = nil

    @State private var periodFilter: DashboardTimeRange = .all

    @State private var searchText: String = ""
    private let presetStartDate: Date?
    @State private var appliedPreset: Bool = false
    @State private var showShare: Bool = false
    @State private var exportURL: URL? = nil
    @State private var collapsedDateGroups: Set<String> = []
    @State private var groupMode: GroupMode = .date


    @State private var collapsedCategories: Set<String> = []
    @State private var showFilters: Bool = true

    // Quick edit sheets
    @State private var quickEditExpense: Expense? = nil
    @State private var showCategorySheet: Bool = false
    @State private var showVehicleSheet: Bool = false
    @State private var showUserSheet: Bool = false


    // CSV Import
    @State private var showImporter: Bool = false

    init(presetStartDate: Date? = nil) {
        self.presetStartDate = presetStartDate
        let context = PersistenceController.shared.container.viewContext
        _viewModel = StateObject(wrappedValue: ExpenseViewModel(context: context))
    }
    // Extracted to help the compiler type-check faster




    private var vehicleUserFilters: some View {
        HStack(spacing: 12) {
            VehicleFilterMenu(viewModel: viewModel)
            UserFilterMenu(viewModel: viewModel)
        }
    }

    // Compact filters bar
    private var periodTitle: String {
        switch periodFilter {
        case .all: return "All"
        case .today: return "Today"
        case .week: return "Week"
        case .month: return "Month"
        }
    }
    private var categoryTitle: String {
        let c = viewModel.selectedCategory
        switch c.lowercased() {
        case "all": return "All"
        case "vehicle": return "Vehicle"
        case "personal": return "Personal"
        case "employee": return "Employee"
        default: return "Category"
        }
    }
    private var groupTitle: String { groupMode == .date ? "Date" : "Category" }
    private var filtersAreDefault: Bool {
        periodFilter == .all &&
        viewModel.selectedCategory.lowercased() == "all" &&
        viewModel.selectedVehicle == nil &&
        viewModel.selectedUser == nil &&
        groupMode == .date
    }

    private var filtersBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                // Period menu
                Menu {
                    Button("All") { periodFilter = .all }
                    Button("Today") { periodFilter = .today }
                    Button("Week") { periodFilter = .week }
                    Button("Month") { periodFilter = .month }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "calendar")
                            .font(.caption)
                        Text(periodTitle)
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

                // Category menu
                Menu {
                    Button("All") { viewModel.selectedCategory = "all"; viewModel.fetchExpenses() }
                    Button("Vehicle") { viewModel.selectedCategory = "vehicle"; viewModel.fetchExpenses() }
                    Button("Personal") { viewModel.selectedCategory = "personal"; viewModel.fetchExpenses() }
                    Button("Employee") { viewModel.selectedCategory = "employee"; viewModel.fetchExpenses() }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "tag.fill").font(.caption)
                        Text(categoryTitle)
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

                // Group menu
                Menu {
                    Button("Date") { groupMode = .date }
                    Button("Category") { groupMode = .category }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "square.grid.2x2").font(.caption)
                        Text(groupTitle)
                            .font(.footnote)
                        Image(systemName: "chevron.down").font(.caption2).opacity(0.6)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .frame(minHeight: 28)
                    .foregroundColor(ColorTheme.secondaryText)
                    .background(Capsule().fill(Color.gray.opacity(0.1)))
                }

                Button {
                    resetFilters()
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "xmark.circle.fill").font(.caption)
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
                .disabled(filtersAreDefault)
                .opacity(filtersAreDefault ? 0.5 : 1)

                // Vehicle & User menus (existing styled pills)
                vehicleUserFilters
            }
            .padding(.horizontal)
            .padding(.vertical, 8)
        }
    }


    // Group expenses by category with subtotals
    private var groupedByCategory: [(key: String, items: [Expense], subtotal: Decimal)] {
        let groups = Dictionary(grouping: viewModel.expenses) { (e: Expense) -> String in
            (e.category?.isEmpty == false ? e.category! : "Uncategorized")
        }
        // Order: vehicle, personal, employee, then others alphabetically
        func groupOrder(_ key: String) -> Int {
            switch key.lowercased() {
            case "vehicle": return 0
            case "personal": return 1
            case "employee": return 2
            default: return 3
            }
        }
        let mapped = groups.map { (key, items) -> (String, [Expense], Decimal) in
            let subtotal = items.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) }
            return (key, items, subtotal)
        }
        return mapped.sorted { (a, b) in
            let oa = groupOrder(a.0)
            let ob = groupOrder(b.0)
            if oa != ob { return oa < ob }
            return a.0.localizedCaseInsensitiveCompare(b.0) == .orderedAscending
        }
    }


    // Helper: map a date to a bucket title used in the UI (Today, Yesterday, Last 7 Days, Last 30 Days, Older)
    private func dateBucket(for date: Date?) -> String {
        let cal = Calendar.current
        guard let d = date else { return "Older" }
        if cal.isDateInToday(d) { return "Today" }
        if cal.isDateInYesterday(d) { return "Yesterday" }
        let now = Date()
        if let seven = cal.date(byAdding: .day, value: -7, to: now), d >= seven { return "Last 7 Days" }
        if let thirty = cal.date(byAdding: .day, value: -30, to: now), d >= thirty { return "Last 30 Days" }
        return "Older"
    }

    // Group expenses by date buckets with subtotals (Today, Yesterday, Last 7 Days, Last 30 Days, Older)
    private var groupedByDate: [(key: String, items: [Expense], subtotal: Decimal)] {
        let cal = Calendar.current
        let now = Date()
        let sevenDaysAgo = cal.date(byAdding: .day, value: -7, to: now) ?? now
        let thirtyDaysAgo = cal.date(byAdding: .day, value: -30, to: now) ?? now

        func bucket(for date: Date?) -> String {
            guard let d = date else { return "Older" }
            if cal.isDateInToday(d) { return "Today" }
            if cal.isDateInYesterday(d) { return "Yesterday" }
            if d >= sevenDaysAgo { return "Last 7 Days" }
            if d >= thirtyDaysAgo { return "Last 30 Days" }
            return "Older"
        }

        // Group
        let groups = Dictionary(grouping: viewModel.expenses) { (e: Expense) -> String in
            bucket(for: e.date)
        }

        // Sort items inside each group by date desc; compute subtotal
        let mapped: [(String, [Expense], Decimal)] = groups.map { (key, items) in
            let sortedItems = items.sorted { (a, b) in
                let da = a.date ?? .distantPast
                let db = b.date ?? .distantPast
                return da > db
            }
            let subtotal = sortedItems.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) }

            return (key, sortedItems, subtotal)
        }

        func order(_ key: String) -> Int {
            switch key {
            case "Today": return 0
            case "Yesterday": return 1
            case "Last 7 Days": return 2
            case "Last 30 Days": return 3
            default: return 4
            }
        }

        return mapped.sorted { a, b in
            let oa = order(a.0)
            let ob = order(b.0)
            if oa != ob { return oa < ob }
            return a.0 < b.0
        }
    }
    // Fast summaries for headers to avoid heavy recomputation on every render
    private var dateSummary: [String: (count: Int, subtotal: Decimal)] {
        var dict: [String: (count: Int, subtotal: Decimal)] = [:]
        for e in viewModel.expenses {
            let key = dateBucket(for: e.date)
            let amt = e.amount?.decimalValue ?? 0
            let cur = dict[key] ?? (count: 0, subtotal: Decimal(0))
            dict[key] = (count: cur.count + 1, subtotal: cur.subtotal + amt)
        }
        return dict
    }

    private var categorySummary: [String: (count: Int, subtotal: Decimal)] {
        var dict: [String: (count: Int, subtotal: Decimal)] = [:]
        for e in viewModel.expenses {
            let key = (e.category?.isEmpty == false ? e.category! : "Uncategorized")
            let amt = e.amount?.decimalValue ?? 0
            let cur = dict[key] ?? (count: 0, subtotal: Decimal(0))
            dict[key] = (count: cur.count + 1, subtotal: cur.subtotal + amt)
        }
        return dict
    }

    private func mutateExpense<T>(_ action: () throws -> T) -> T? {
        do {
            return try action()
        } catch {
            print("Expense mutation failed: \(error)")
            return nil
        }
    }
    
    private func deleteExpenseFromCloud(_ id: UUID?) {
        guard let id, case .signedIn(let user) = sessionStore.status else { return }
        Task {
            await cloudSyncManager.deleteExpense(id: id, dealerId: user.id)
        }
    }

    @ViewBuilder
    private func expenseListRow(_ expense: Expense) -> some View {
        Button {
            editingExpense = expense
            showingEdit = true
        } label: {
            ExpenseRow(expense: expense)
        }
        .buttonStyle(.plain)
            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                Button(role: .destructive) {
                    if let deletedId = (mutateExpense { try viewModel.deleteExpense(expense) } ?? nil) {
                        deleteExpenseFromCloud(deletedId)
                    }
                } label: {
                    Label("Delete", systemImage: "trash")
                }

                Button {
                    editingExpense = expense
                    showingEdit = true
                } label: {
                    Label("Edit", systemImage: "pencil")
                }
                .tint(ColorTheme.primary)
            }
            .swipeActions(edge: .leading, allowsFullSwipe: true) {
                Button(role: .destructive) {
                    if let deletedId = (mutateExpense { try viewModel.deleteExpense(expense) } ?? nil) {
                        deleteExpenseFromCloud(deletedId)
                    }
                } label: {
                    Label("Delete", systemImage: "trash")
                }
                Button("Category") {
                    quickEditExpense = expense
                    showCategorySheet = true
                }.tint(.blue)
                Button("Vehicle") {
                    quickEditExpense = expense
                    showVehicleSheet = true
                }.tint(.indigo)
                Button("User") {
                    quickEditExpense = expense
                    showUserSheet = true
                }.tint(.teal)
            }
    }

    private func categoryDisplayName(_ category: String) -> String {
        switch category.lowercased() {
        case "vehicle": return "Vehicle"
        case "personal": return "Personal"
        case "employee": return "Employee"
        default: return category.capitalized
        }
    }

    private func resetFilters() {
        periodFilter = .all
        viewModel.selectedCategory = "all"
        viewModel.selectedVehicle = nil
        viewModel.selectedUser = nil
        groupMode = .date
        viewModel.startDate = nil
        viewModel.endDate = nil
        viewModel.fetchExpenses()
    }




    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Filters bar
                if showFilters {
                    filtersBar
                        .transition(.move(edge: .top).combined(with: .opacity))
                        .background(ColorTheme.background)
                }

                // Expense List
                List {
                        // Summary analytics (moved here to scroll away)
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Category Summary")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundColor(ColorTheme.primaryText)

                            ForEach(groupedByCategory, id: \.key) { group in
                                HStack {
                                    HStack(spacing: 8) {
                                        Circle()
                                            .fill(ColorTheme.categoryColor(for: group.key))
                                            .frame(width: 6, height: 6)

                                        Text(categoryDisplayName(group.key))
                                            .font(.caption)
                                            .foregroundColor(ColorTheme.primaryText)
                                            .lineLimit(1)
                                    }

                                    Spacer()

                                    Text(group.subtotal.asCurrency())
                                        .font(.caption)
                                        .fontWeight(.semibold)
                                        .foregroundColor(ColorTheme.primaryText)
                                }
                            }
                        }
                        .padding(.horizontal)
                        .padding(.vertical, 8)
                        .listRowBackground(Color.clear)


                        if viewModel.expenses.isEmpty {
                            VStack(spacing: 16) {
                                Image(systemName: "dollarsign.circle.fill")
                                    .font(.system(size: 60))
                                    .foregroundColor(ColorTheme.secondaryText)
                                Text("No expenses found")
                                    .font(.headline)
                                    .foregroundColor(ColorTheme.secondaryText)
                                Text("Add the first expense")
                                    .font(.subheadline)
                                    .foregroundColor(ColorTheme.tertiaryText)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 40)
                            .listRowBackground(Color.clear)
                        }


                        if groupMode == .date {
                            ForEach(groupedByDate, id: \.key) { group in
                                // Header row for date bucket
                                HStack(spacing: 10) {
                                    Button(action: {
                                        if collapsedDateGroups.contains(group.key) {
                                            collapsedDateGroups.remove(group.key)
                                        } else {
                                            collapsedDateGroups.insert(group.key)
                                        }
                                    }) {
                                        Image(systemName: collapsedDateGroups.contains(group.key) ? "chevron.right" : "chevron.down")
                                            .font(.caption)
                                            .foregroundColor(ColorTheme.secondaryText)
                                    }
                                    Text(group.key)
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(ColorTheme.primaryText)
                                    Spacer()
                                    let s = dateSummary[group.key] ?? (count: 0, subtotal: Decimal(0))
                                    Text("\(s.count) · \(s.subtotal.asCurrency())")
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(ColorTheme.primary)
                                }
                                .padding(.horizontal, 2)
                                .listRowBackground(Color.clear)

                        if !collapsedDateGroups.contains(group.key) {
                            ForEach(group.items, id: \.objectID) { expense in
                                    expenseListRow(expense)
                                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                                        .listRowBackground(Color.clear)
                            }
                        }
                    }
                } else {
                    ForEach(groupedByCategory, id: \.key) { group in
                                // Non-sticky header row for the category
                                HStack(spacing: 10) {
                                    Button(action: {
                                        if collapsedCategories.contains(group.key) {
                                            collapsedCategories.remove(group.key)
                                        } else {
                                            collapsedCategories.insert(group.key)
                                        }
                                    }) {
                                        Image(systemName: collapsedCategories.contains(group.key) ? "chevron.right" : "chevron.down")
                                            .font(.caption)
                                            .foregroundColor(ColorTheme.secondaryText)
                                    }
                                    CategoryBadge(category: group.key)
                                    Spacer()

                                    let s = categorySummary[group.key] ?? (count: 0, subtotal: Decimal(0))
                                    Text("\(s.count) · \(s.subtotal.asCurrency())")
                                        .font(.subheadline)
                                        .fontWeight(.semibold)
                                        .foregroundColor(ColorTheme.primary)
                                }
                                .padding(.horizontal, 2)
                                .listRowBackground(Color.clear)

                                if !collapsedCategories.contains(group.key) {
                                    ForEach(group.items, id: \.objectID) { expense in
                                        expenseListRow(expense)
                                            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                                            .listRowBackground(Color.clear)
                                    }
                                }
                            }
                        }
                        // Total at bottom
                        Section {
                            HStack {
                                Text("Total")
                                    .font(.headline)
                                    .foregroundColor(ColorTheme.primaryText)
                                Spacer()
                                Text(viewModel.totalExpenses().asCurrency())
                                    .font(.headline)
                                    .fontWeight(.bold)
                                    .foregroundColor(ColorTheme.primaryText)
                            }
                            .listRowInsets(EdgeInsets(top: 20, leading: 16, bottom: 12, trailing: 16))
                            .listRowBackground(Color.clear)
                        }

                    }
                    .listStyle(.plain)
                    .background(ColorTheme.secondaryBackground)
            }
            .background(ColorTheme.secondaryBackground)
            .navigationTitle("Expenses")
            .onChange(of: periodFilter) { oldValue, newValue in
                let cal = Calendar.current
                switch newValue {
                case .today:
                    viewModel.startDate = cal.startOfDay(for: Date())
                    viewModel.endDate = Date()
                case .week:
                    viewModel.startDate = cal.date(byAdding: .day, value: -7, to: Date())
                    viewModel.endDate = Date()
                case .month:
                    viewModel.startDate = cal.date(byAdding: .day, value: -30, to: Date())
                    viewModel.endDate = Date()
                case .all:
                    viewModel.startDate = nil
                    viewModel.endDate = nil
                }
                viewModel.fetchExpenses()
            }
            .refreshable {
                viewModel.fetchExpenses()
            }

            .sheet(isPresented: $showCategorySheet) {
                if let exp = quickEditExpense {
                    NavigationStack {
                        List {
                            Button("Vehicle") {
                                mutateExpense {
                                    try viewModel.updateExpense(
                                        exp,
                                        amount: exp.amount?.decimalValue ?? 0,
                                        date: exp.date ?? Date(),
                                        description: exp.expenseDescription ?? "",
                                        category: "vehicle",
                                        vehicle: exp.vehicle,
                                        user: exp.user,
                                        account: exp.account
                                    )
                                }
                                showCategorySheet = false
                            }
                            Button("Personal") {
                                mutateExpense {
                                    try viewModel.updateExpense(
                                        exp,
                                        amount: exp.amount?.decimalValue ?? 0,
                                        date: exp.date ?? Date(),
                                        description: exp.expenseDescription ?? "",
                                        category: "personal",
                                        vehicle: exp.vehicle,
                                        user: exp.user,
                                        account: exp.account
                                    )
                                }
                                showCategorySheet = false
                            }
                            Button("Employee") {
                                mutateExpense {
                                    try viewModel.updateExpense(
                                        exp,
                                        amount: exp.amount?.decimalValue ?? 0,
                                        date: exp.date ?? Date(),
                                        description: exp.expenseDescription ?? "",
                                        category: "employee",
                                        vehicle: exp.vehicle,
                                        user: exp.user,
                                        account: exp.account
                                    )
                                }
                                showCategorySheet = false
                            }
                        }
                        .navigationTitle("Change Category")
                        .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") { showCategorySheet = false } } }
                    }
                }
            }
            .sheet(isPresented: $showVehicleSheet) {
                if let exp = quickEditExpense {
                    NavigationStack {
                        List {
                            Button("None") {
                                mutateExpense {
                                    try viewModel.updateExpense(
                                        exp,
                                        amount: exp.amount?.decimalValue ?? 0,
                                        date: exp.date ?? Date(),
                                        description: exp.expenseDescription ?? "",
                                        category: exp.category ?? "",
                                        vehicle: nil,
                                        user: exp.user,
                                        account: exp.account
                                    )
                                }
                                showVehicleSheet = false
                            }
                            ForEach(viewModel.vehicles, id: \.objectID) { v in
                                Button("\(v.make ?? "") \(v.model ?? "")") {
                                    mutateExpense {
                                        try viewModel.updateExpense(
                                            exp,
                                            amount: exp.amount?.decimalValue ?? 0,
                                            date: exp.date ?? Date(),
                                            description: exp.expenseDescription ?? "",
                                            category: exp.category ?? "",
                                            vehicle: v,
                                            user: exp.user,
                                            account: exp.account
                                        )
                                    }
                                    showVehicleSheet = false
                                }
                            }
                        }
                        .navigationTitle("Assign Vehicle")
                        .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") { showVehicleSheet = false } } }
                    }
                }
            }
            .sheet(isPresented: $showUserSheet) {
                if let exp = quickEditExpense {
                    NavigationStack {
                        List {
                            Button("None") {
                                mutateExpense {
                                    try viewModel.updateExpense(
                                        exp,
                                        amount: exp.amount?.decimalValue ?? 0,
                                        date: exp.date ?? Date(),
                                        description: exp.expenseDescription ?? "",
                                        category: exp.category ?? "",
                                        vehicle: exp.vehicle,
                                        user: nil,
                                        account: exp.account
                                    )
                                }
                                showUserSheet = false
                            }
                            ForEach(viewModel.users, id: \.objectID) { u in
                                Button(u.name ?? "") {
                                    mutateExpense {
                                        try viewModel.updateExpense(
                                            exp,
                                            amount: exp.amount?.decimalValue ?? 0,
                                            date: exp.date ?? Date(),
                                            description: exp.expenseDescription ?? "",
                                            category: exp.category ?? "",
                                            vehicle: exp.vehicle,
                                            user: u,
                                            account: exp.account
                                        )
                                    }
                                    showUserSheet = false
                                }
                            }
                        }
                        .navigationTitle("Assign User")
                        .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") { showUserSheet = false } } }
                    }
                }
            }

            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button {
                        let newValue = !showFilters
                        withAnimation(.easeInOut) {
                            showFilters = newValue
                        }
                        if !newValue {
                            resetFilters()
                        }
                    } label: {
                        Label(
                            showFilters ? "Hide Filters" : "Filters",
                            systemImage: "line.3.horizontal.decrease.circle"
                        )
                    }
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    Menu {
                        Button("Date ↓") { viewModel.sortOption = .dateDesc; viewModel.fetchExpenses() }
                        Button("Date ↑") { viewModel.sortOption = .dateAsc; viewModel.fetchExpenses() }
                        Button("Amount ↓") { viewModel.sortOption = .amountDesc; viewModel.fetchExpenses() }
                        Button("Amount ↑") { viewModel.sortOption = .amountAsc; viewModel.fetchExpenses() }
                    } label: {
                        Image(systemName: "arrow.up.arrow.down.circle")
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showImporter = true }) {
                        Image(systemName: "square.and.arrow.down")
                    }
                    .help("Import CSV")
                    .accessibilityLabel("Import expenses from CSV")
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        let csv = viewModel.csvStringForCurrentExpenses()
                        let url = FileManager.default.temporaryDirectory.appendingPathComponent("expenses-\(Int(Date().timeIntervalSince1970)).csv")
                        do {
                            try csv.write(to: url, atomically: true, encoding: .utf8)
                            exportURL = url
                            showShare = true
                        } catch {
                            print("Failed to write CSV: \(error)")
                        }
                    }) {
                        Image(systemName: "square.and.arrow.up")
                    }
                    .help("Export CSV")
                    .accessibilityLabel("Export expenses as CSV")
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddExpense = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddExpense) {
                AddExpenseView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingEdit) {
                AddExpenseView(viewModel: viewModel, editingExpense: editingExpense)
            }
            .fileImporter(isPresented: $showImporter, allowedContentTypes: [.commaSeparatedText, .text]) { result in
                switch result {
                case .success(let url):
                    viewModel.importCSV(from: url)
                case .failure(let error):
                    print("Import failed: \(error)")
                }
            }

            .navigationTitle("Expenses")
            .searchable(text: $searchText, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search expenses")
            .onChange(of: searchText) { _, newValue in
                viewModel.searchQuery = newValue
                viewModel.fetchExpenses()
            }
            .onAppear {
                if !appliedPreset, let d = presetStartDate {
                    let cal = Calendar.current
                    let start = cal.startOfDay(for: d)
                    viewModel.startDate = start
                    // Try to match preset to a period
                    if cal.isDateInToday(start) {
                        periodFilter = .today
                    } else {
                        periodFilter = .all
                    }
                    viewModel.fetchExpenses()
                    appliedPreset = true
                }
            }
            .sheet(isPresented: $showShare) {
                if let url = exportURL {
                    ActivityView(activityItems: [url])
                }
            }

        }
    }
}

struct ExpenseRow: View {
    let expense: Expense

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Top row: description and amount
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(expense.expenseDescription ?? "No description")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(ColorTheme.primaryText)
                    .lineLimit(1)
                    .truncationMode(.tail)

                Spacer(minLength: 8)

                Text((expense.amount?.decimalValue ?? 0).asCurrency())
                    .font(.body)
                    .fontWeight(.semibold)
                    .foregroundColor(ColorTheme.primaryText)
            }

            // Metadata row: category, vehicle, user
            HStack(spacing: 6) {
                CategoryBadge(category: expense.category ?? "")

                if let vehicle = expense.vehicle {
                    Text("•")
                        .font(.caption2)
                        .foregroundColor(ColorTheme.tertiaryText)
                    Text("\(vehicle.make ?? "") \(vehicle.model ?? "")")
                        .font(.caption)
                        .foregroundColor(ColorTheme.secondaryText)
                        .lineLimit(1)
                        .truncationMode(.tail)
                }

                if let user = expense.user, let name = user.name, !name.isEmpty {
                    Text("•")
                        .font(.caption2)
                        .foregroundColor(ColorTheme.tertiaryText)
                    Text(name)
                        .font(.caption)
                        .foregroundColor(ColorTheme.secondaryText)
                        .lineLimit(1)
                        .truncationMode(.tail)
                }

                Spacer()

                // Date on the right
                Text(expense.date ?? Date(), formatter: shortDateFormatter)
                    .font(.caption2)
                    .foregroundColor(ColorTheme.tertiaryText)
            }
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 14)
        .cardStyle()
    }

    private var shortDateFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        return formatter
    }
}

struct CategoryBadge: View {
    let category: String

    var categoryText: String {
        switch category.lowercased() {
        case "vehicle":
            return "Vehicle"
        case "personal":
            return "Personal"
        case "employee":
            return "Employee"
        default:
            return category.capitalized
        }
    }

    var body: some View {
        Text(categoryText)
            .font(.caption2)
            .fontWeight(.medium)
            .foregroundColor(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(ColorTheme.categoryColor(for: category))
            .cornerRadius(6)
    }
}

@MainActor struct ActivityView: UIViewControllerRepresentable {
    let activityItems: [Any]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// Modern, HIG-friendly expenses layout tailored for Dubai dealers.
struct DealerExpenseDashboardView: View {
    @EnvironmentObject var sessionStore: SessionStore
    @EnvironmentObject var cloudSyncManager: CloudSyncManager
    @StateObject private var viewModel: ExpenseViewModel
    @State private var showingAddExpense = false
    @State private var editingExpense: Expense? = nil
    @State private var searchText = ""

    private func deleteExpenseFromCloud(_ id: UUID?) {
        guard let id, case .signedIn(let user) = sessionStore.status else { return }
        Task {
            await cloudSyncManager.deleteExpense(id: id, dealerId: user.id)
        }
    }

    private func mutateExpense<T>(_ action: () throws -> T) -> T? {
        do {
            return try action()
        } catch {
            print("Expense mutation failed: \(error)")
            return nil
        }
    }

    private let chipBackground = ColorTheme.background
    
    private let amountFormatter: NumberFormatter = {
        let nf = NumberFormatter()
        nf.numberStyle = .decimal
        nf.maximumFractionDigits = 0
        nf.minimumFractionDigits = 0
        nf.groupingSeparator = " "
        nf.locale = Locale(identifier: "en_AE")
        return nf
    }()
    
    private let detailDateFormatter: DateFormatter = {
        let df = DateFormatter()
        df.dateFormat = "d MMM"
        df.locale = Locale(identifier: "en_AE")
        return df
    }()

    init() {
        let context = PersistenceController.shared.container.viewContext
        _viewModel = StateObject(wrappedValue: ExpenseViewModel(context: context))
    }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {
                ColorTheme.background.ignoresSafeArea()

                VStack(spacing: 0) {
                    header
                    
                    // Filter chips
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            vehicleChip
                            userChip
                            categoryChip
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                    }
                    .background(ColorTheme.background)

                    List {
                        if groupedExpenses.isEmpty {
                            emptyState
                                .listRowSeparator(.hidden)
                                .listRowInsets(EdgeInsets())
                                .listRowBackground(Color.clear)
                        } else {
                            ForEach(groupedExpenses, id: \.key) { group in
                                Section {
                                    ForEach(group.items, id: \.objectID) { expense in
                                        Button {
                                            editingExpense = expense
                                        } label: {
                                            CompactExpenseRow(expense: expense)
                                        }
                                        .buttonStyle(.plain)
                                        .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                                        .listRowBackground(Color.clear)
                                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                            Button(role: .destructive) {
                                                if let deletedId = (mutateExpense { try viewModel.deleteExpense(expense) } ?? nil) {
                                                    deleteExpenseFromCloud(deletedId)
                                                }
                                            } label: {
                                                Label("Delete", systemImage: "trash")
                                            }
                                            
                                            Button {
                                                editingExpense = expense
                                            } label: {
                                                Label("Edit", systemImage: "pencil")
                                            }
                                            .tint(ColorTheme.primary)
                                        }
                                    }
                                } header: {
                                    HStack {
                                        Text(group.key)
                                            .font(.subheadline)
                                            .fontWeight(.semibold)
                                            .foregroundColor(ColorTheme.secondaryText)
                                        Spacer()
                                        Text(group.subtotal.asCurrency())
                                            .font(.caption)
                                            .fontWeight(.medium)
                                            .foregroundColor(ColorTheme.tertiaryText)
                                    }
                                    .padding(.horizontal, 20)
                                    .padding(.vertical, 8)
                                    .background(ColorTheme.background.opacity(0.95))
                                    .listRowInsets(EdgeInsets())
                                }
                            }
                            
                            Spacer(minLength: 90)
                                .listRowSeparator(.hidden)
                                .listRowInsets(EdgeInsets())
                                .listRowBackground(Color.clear)
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .background(ColorTheme.background)
                    .refreshable {
                        if case .signedIn(let user) = sessionStore.status {
                            await cloudSyncManager.manualSync(user: user)
                            viewModel.fetchExpenses()
                        }
                    }
                }

                fab
                    .padding(.trailing, 24)
                    .padding(.bottom, 24)
            }
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showingAddExpense) {
                AddExpenseView(viewModel: viewModel)
            }
            .sheet(isPresented: Binding(get: { editingExpense != nil }, set: { if !$0 { editingExpense = nil } })) {
                if let expense = editingExpense {
                    AddExpenseView(viewModel: viewModel, editingExpense: expense)
                }
            }
            .onAppear {
                viewModel.refreshFiltersIfNeeded()
                viewModel.fetchExpenses()
            }
            .searchable(text: $searchText, placement: .automatic, prompt: "Search expenses")
            .onChange(of: searchText) { _, newValue in
                viewModel.searchQuery = newValue
                viewModel.fetchExpenses()
            }
        }
        .preferredColorScheme(.light)
    }

    private var header: some View {

        VStack(spacing: 16) {
            HStack(alignment: .center) {
                Text("Expenses")
                    .font(.system(size: 34, weight: .bold))
                    .foregroundColor(ColorTheme.primaryText)
                
                Spacer()
            }
            
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("This Week")
                        .font(.subheadline)
                        .foregroundColor(ColorTheme.secondaryText)
                        .fontWeight(.medium)
                    
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text("\(formattedBigAmount(thisWeekTotal)) AED")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundColor(ColorTheme.primaryText)
                        
                        if let delta = weekDeltaPercent {
                            HStack(spacing: 2) {
                                Image(systemName: delta > 0 ? "arrow.up.right" : "arrow.down.right")
                                Text(String(format: "%.0f%%", abs(delta)))
                            }
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(delta > 0 ? ColorTheme.danger : ColorTheme.success) // More expenses = danger/bad usually, less = success/good
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(
                                Capsule()
                                    .fill((delta > 0 ? ColorTheme.danger : ColorTheme.success).opacity(0.1))
                            )
                        }
                    }
                }
                Spacer()
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 16)
        .background(ColorTheme.background)
    }

    // MARK: - Chips

    private var vehicleChip: some View {
        Menu {
            Button("All vehicles") {
                viewModel.selectedVehicle = nil
                viewModel.fetchExpenses()
            }
            Divider()
            ForEach(viewModel.vehicles, id: \.objectID) { vehicle in
                Button {
                    viewModel.selectedVehicle = vehicle
                    viewModel.fetchExpenses()
                } label: {
                    Text("\(vehicle.make ?? "") \(vehicle.model ?? "")")
                }
            }
        } label: {
            filterChip(title: vehicleChipTitle, isActive: viewModel.selectedVehicle != nil)
        }
    }

    private var userChip: some View {
        Menu {
            Button("All employees") {
                viewModel.selectedUser = nil
                viewModel.fetchExpenses()
            }
            Divider()
            ForEach(viewModel.users, id: \.objectID) { user in
                Button {
                    viewModel.selectedUser = user
                    viewModel.fetchExpenses()
                } label: {
                    Text(user.name ?? "")
                }
            }
        } label: {
            filterChip(title: userChipTitle, isActive: viewModel.selectedUser != nil)
        }
    }

    private var categoryChip: some View {
        Menu {
            Button("All categories") {
                viewModel.selectedCategory = "all"
                viewModel.fetchExpenses()
            }
            Button("Vehicle") {
                viewModel.selectedCategory = "vehicle"
                viewModel.fetchExpenses()
            }
            Button("Employee") {
                viewModel.selectedCategory = "employee"
                viewModel.fetchExpenses()
            }
            Button("Personal") {
                viewModel.selectedCategory = "personal"
                viewModel.fetchExpenses()
            }
        } label: {
            filterChip(title: categoryChipTitle, isActive: viewModel.selectedCategory.lowercased() != "all")
        }
    }

    private func filterChip(title: String, isActive: Bool) -> some View {
        HStack(spacing: 6) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
            Image(systemName: "chevron.down")
                .font(.caption2)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(isActive ? ColorTheme.primary.opacity(0.1) : ColorTheme.cardBackground)
        .foregroundColor(isActive ? ColorTheme.primary : ColorTheme.secondaryText)
        .clipShape(Capsule())
        .overlay(
            Capsule()
                .strokeBorder(isActive ? ColorTheme.primary : Color.gray.opacity(0.2), lineWidth: 1)
        )
    }

    // MARK: - Compact Expense Row
    
    private struct CompactExpenseRow: View {
        let expense: Expense
        
        var body: some View {
            HStack(spacing: 12) {
                // Icon
                ZStack {
                    Circle()
                        .fill(ColorTheme.background)
                        .frame(width: 40, height: 40)
                    
                    Image(systemName: iconName(for: expense))
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(ColorTheme.primary)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(primaryText(for: expense))
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(ColorTheme.primaryText)
                        .lineLimit(1)
                    
                    Text(subtitleText(for: expense))
                        .font(.caption)
                        .foregroundColor(ColorTheme.secondaryText)
                        .lineLimit(1)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text((expense.amount?.decimalValue ?? 0).asCurrency())
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(ColorTheme.primaryText)
                    
                    CategoryBadge(category: expense.category ?? "")
                        .scaleEffect(0.8, anchor: .trailing)
                }
            }
            .padding(12)
            .background(ColorTheme.cardBackground)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.03), radius: 5, x: 0, y: 2)
        }
        
        private func iconName(for expense: Expense) -> String {
            let category = expense.category?.lowercased() ?? ""
            switch category {
            case "vehicle": return "car.fill"
            case "employee": return "person.fill"
            case "personal": return "bag.fill"
            default: return expense.vehicle == nil ? "doc.text.fill" : "car.fill"
            }
        }
        
        private func primaryText(for expense: Expense) -> String {
            let desc = (expense.expenseDescription ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            if !desc.isEmpty { return desc }
            return expense.category?.capitalized ?? "Expense"
        }
        
        private func subtitleText(for expense: Expense) -> String {
            var parts: [String] = []
            if let v = expense.vehicle {
                let make = v.make ?? ""
                let model = v.model ?? ""
                let combined = "\(make) \(model)".trimmingCharacters(in: .whitespaces)
                if !combined.isEmpty { parts.append(combined) }
            }
            if let user = expense.user?.name, !user.isEmpty {
                parts.append(user)
            }
            return parts.isEmpty ? "No details" : parts.joined(separator: " • ")
        }
    }

    private var fab: some View {
        Button {
            showingAddExpense = true
        } label: {
            Image(systemName: "plus")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.white)
                .frame(width: 56, height: 56)
                .background(Circle().fill(ColorTheme.primary))
                .shadow(color: ColorTheme.primary.opacity(0.4), radius: 10, y: 5)
        }
        .accessibilityLabel("Add expense")
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 48))
                .foregroundColor(ColorTheme.tertiaryText.opacity(0.5))
            
            VStack(spacing: 8) {
                Text("No expenses found")
                    .font(.headline)
                    .foregroundColor(ColorTheme.secondaryText)
                
                Text("Try adjusting your filters or add a new expense.")
                    .font(.subheadline)
                    .foregroundColor(ColorTheme.tertiaryText)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.vertical, 60)
        .frame(maxWidth: .infinity)
    }

    // MARK: - Helpers

    private var groupedExpenses: [(key: String, items: [Expense], subtotal: Decimal)] {
        let cal = Calendar.current
        let now = Date()
        let sevenDaysAgo = cal.date(byAdding: .day, value: -7, to: now) ?? now
        let thirtyDaysAgo = cal.date(byAdding: .day, value: -30, to: now) ?? now

        func bucket(for date: Date?) -> String {
            guard let d = date else { return "Older" }
            if cal.isDateInToday(d) { return "Today" }
            if cal.isDateInYesterday(d) { return "Yesterday" }
            if d >= sevenDaysAgo { return "Last 7 Days" }
            if d >= thirtyDaysAgo { return "Last 30 Days" }
            return "Older"
        }

        let groups = Dictionary(grouping: viewModel.expenses) { (e: Expense) -> String in
            bucket(for: e.date)
        }

        let mapped: [(String, [Expense], Decimal)] = groups.map { (key, items) in
            let sortedItems = items.sorted { (a, b) in
                let da = a.date ?? .distantPast
                let db = b.date ?? .distantPast
                return da > db
            }
            let subtotal = sortedItems.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) }
            return (key, sortedItems, subtotal)
        }

        func order(_ key: String) -> Int {
            switch key {
            case "Today": return 0
            case "Yesterday": return 1
            case "Last 7 Days": return 2
            case "Last 30 Days": return 3
            default: return 4
            }
        }

        return mapped.sorted { a, b in
            let oa = order(a.0)
            let ob = order(b.0)
            if oa != ob { return oa < ob }
            return a.0 < b.0
        }
    }

    private var vehicleChipTitle: String {
        guard let v = viewModel.selectedVehicle else { return "Vehicle" }
        let make = v.make ?? ""
        let model = v.model ?? ""
        let combined = "\(make) \(model)".trimmingCharacters(in: .whitespaces)
        return combined.isEmpty ? "Selected" : combined
    }

    private var userChipTitle: String {
        viewModel.selectedUser?.name ?? "Employee"
    }


    private var categoryChipTitle: String {
        let title = viewModel.selectedCategory
        if title.lowercased() == "all" { return "Category" }
        return title.capitalized
    }

    private var thisWeekTotal: Decimal {
        let interval = currentWeekInterval
        return total(in: interval)
    }

    private var lastWeekTotal: Decimal {
        let cal = Calendar.current
        guard let lastWeekStart = cal.date(byAdding: .weekOfYear, value: -1, to: currentWeekInterval.start),
              let lastWeekEnd = cal.date(byAdding: .second, value: -1, to: currentWeekInterval.start) else {
            return 0
        }
        return total(in: DateInterval(start: lastWeekStart, end: lastWeekEnd))
    }

    private var weekDeltaPercent: Double? {
        let last = lastWeekTotal
        guard last != 0 else { return nil }
        let diff = (thisWeekTotal - last) / last
        return NSDecimalNumber(decimal: diff * 100).doubleValue
    }

    private func total(in interval: DateInterval) -> Decimal {
        viewModel.expenses.reduce(0) { partial, expense in
            guard let date = expense.date else { return partial }
            guard interval.contains(date) else { return partial }
            return partial + (expense.amount?.decimalValue ?? 0)
        }
    }

    private var currentWeekInterval: DateInterval {
        let cal = Calendar.current
        let now = Date()
        let start = cal.date(from: cal.dateComponents([.yearForWeekOfYear, .weekOfYear], from: now)) ?? now
        let end = cal.date(byAdding: .day, value: 7, to: start) ?? now
        return DateInterval(start: start, end: end)
    }

    private func formattedBigAmount(_ value: Decimal) -> String {
        let number = NSDecimalNumber(decimal: value)
        return amountFormatter.string(from: number) ?? "0"
    }

    private func iconName(for expense: Expense) -> String {
        let category = expense.category?.lowercased() ?? ""
        switch category {
        case "vehicle":
            return "car.fill"
        case "employee":
            return "person.fill"
        case "personal":
            return "bag.fill"
        default:
            return expense.vehicle == nil ? "doc.text.fill" : "car.fill"
        }
    }

    private func primaryText(for expense: Expense) -> String {
        let desc = (expense.expenseDescription ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if !desc.isEmpty { return desc }
        return expense.category?.capitalized ?? "Expense"
    }

    private func subtitleText(for expense: Expense) -> String {
        var parts: [String] = []
        
        // Vehicle Make/Model
        if let v = expense.vehicle {
            let make = v.make ?? ""
            let model = v.model ?? ""
            let combined = "\(make) \(model)".trimmingCharacters(in: .whitespaces)
            if !combined.isEmpty { parts.append(combined) }
        }
        
        // User
        if let user = expense.user?.name, !user.isEmpty {
            parts.append(user)
        }
        
        // VIN
        if let vin = expense.vehicle?.vin, !vin.isEmpty {
            parts.append(vin)
        }
        
        return parts.isEmpty ? "No details" : parts.joined(separator: " • ")
    }
}


#Preview {
    ExpenseListView()
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
}

#Preview("Dealer expense dashboard") {
    DealerExpenseDashboardView()
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
}
