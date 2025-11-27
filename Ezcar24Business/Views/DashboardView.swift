//
//  DashboardView.swift
//  Ezcar24Business
//
//  Compact expense dashboard aligned with mobile-first layout
//

import SwiftUI
import Charts


extension Notification.Name {
    static let dashboardDidRequestAccount = Notification.Name("dashboardDidRequestAccount")
}

enum DashboardDestination: String, Identifiable, Hashable {
    case assets, cashAccounts, bankAccounts, revenue, profit, sold
    var id: String { rawValue }
}

struct DashboardView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @EnvironmentObject private var sessionStore: SessionStore
    @EnvironmentObject private var cloudSyncManager: CloudSyncManager
    @StateObject private var viewModel: DashboardViewModel
    @StateObject private var expenseEntryViewModel: ExpenseViewModel

    @State private var selectedRange: DashboardTimeRange = .today
    @State private var showingAddExpense: Bool = false
    @State private var selectedExpense: Expense? = nil
    @State private var editingExpense: Expense? = nil
    @State private var navPath: [DashboardDestination] = []

    init() {
        let context = PersistenceController.shared.container.viewContext
        _viewModel = StateObject(wrappedValue: DashboardViewModel(context: context))
        _expenseEntryViewModel = StateObject(wrappedValue: ExpenseViewModel(context: context))
    }

    var body: some View {
        NavigationStack(path: $navPath) {
            VStack(spacing: 0) {
                topBar
                
                List {
                    financialOverviewSection
                    todaysExpensesSection
                    summarySection
                    recentExpensesSection
                }
                .listStyle(.plain)
                .scrollContentBackground(.hidden)
                .listSectionSpacing(20)
                .listSectionSpacing(20)
                .background(ColorTheme.background)
                .refreshable {
                    if case .signedIn(let user) = sessionStore.status {
                        await cloudSyncManager.manualSync(user: user)
                        viewModel.fetchFinancialData(range: selectedRange)
                    }
                }
            }
            .background(ColorTheme.background.ignoresSafeArea())
            .navigationDestination(for: DashboardDestination.self) { destinationView(for: $0) }
        }
        .sheet(isPresented: $showingAddExpense) {
            AddExpenseView(viewModel: expenseEntryViewModel)
                .environment(\.managedObjectContext, viewContext)
                .presentationDetents([.large])
                .onDisappear {
                    viewModel.fetchFinancialData(range: selectedRange)
                }
        }
        .sheet(item: $selectedExpense) { expense in
            ExpenseDetailSheet(expense: expense)
                .presentationDetents([.medium, .large])
        }
        .sheet(item: $editingExpense) { expense in
            AddExpenseView(viewModel: expenseEntryViewModel, editingExpense: expense)
                .environment(\.managedObjectContext, viewContext)
                .presentationDetents([.large])
                .onDisappear {
                    viewModel.fetchFinancialData(range: selectedRange)
                }
        }
        .onAppear {
            viewModel.fetchFinancialData(range: selectedRange)
        }
        .onChange(of: selectedRange) { _, newValue in
            viewModel.fetchFinancialData(range: newValue)
        }
    }

    @ViewBuilder
    private func destinationView(for destination: DashboardDestination) -> some View {
        switch destination {
        case .assets:
            VehicleListView(showNavigation: false)
        case .cashAccounts, .bankAccounts:
            FinancialAccountsView()
        case .revenue, .profit:
            SalesListView(showNavigation: false)
        case .sold:
            VehicleListView(presetStatus: "sold", showNavigation: false)
        }
    }
}

// MARK: - Top Navigation

private extension DashboardView {
    var topBar: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(greeting)
                        .font(.subheadline)
                        .foregroundColor(ColorTheme.secondaryText)
                    Text("Dashboard")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(ColorTheme.primaryText)
                }
                
                Spacer()
                
                HStack(spacing: 12) {
                    if cloudSyncManager.isSyncing {
                        ProgressView()
                            .controlSize(.small)
                            .tint(ColorTheme.primary)
                    }

                    Button {
                        NotificationCenter.default.post(name: .dashboardDidRequestAccount, object: nil)
                    } label: {
                        Image(systemName: "person.crop.circle")
                            .font(.title2)
                            .foregroundColor(ColorTheme.primary)
                            .frame(width: 40, height: 40)
                            .background(ColorTheme.secondaryBackground)
                            .clipShape(Circle())
                    }
                    
                    Button {
                        showingAddExpense = true
                    } label: {
                        Image(systemName: "plus")
                            .font(.title3.weight(.semibold))
                            .foregroundColor(.white)
                            .frame(width: 40, height: 40)
                            .background(ColorTheme.primary)
                            .clipShape(Circle())
                            .shadow(color: ColorTheme.primary.opacity(0.3), radius: 4, x: 0, y: 2)
                    }
                }
            }
            
            Picker("Period", selection: $selectedRange) {
                ForEach(DashboardTimeRange.dashboardFilters) { range in
                    Text(range.displayLabel).tag(range)
                }
            }
            .pickerStyle(.segmented)
            .padding(.bottom, 4)
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 12)
        .background(ColorTheme.background)
    }
    
    var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<12: return "Good Morning"
        case 12..<17: return "Good Afternoon"
        default: return "Good Evening"
        }
    }
}

// MARK: - Sections

private extension DashboardView {
    var financialOverviewSection: some View {
        Section {
            VStack(spacing: 12) {
                // First row: Assets, Cash, Bank
                HStack(spacing: 12) {
                    Button {
                        navPath.append(.assets)
                    } label: {
                        FinancialCard(
                            title: "Total Assets",
                            amount: viewModel.totalAssets,
                            icon: "building.columns.fill",
                            color: .blue
                        )
                    }
                    .buttonStyle(.plain)
                    
                    Button {
                        navPath.append(.cashAccounts)
                    } label: {
                        FinancialCard(
                            title: "Cash",
                            amount: viewModel.totalCash,
                            icon: "banknote.fill",
                            color: .green
                        )
                    }
                    .buttonStyle(.plain)
                    
                    Button {
                        navPath.append(.bankAccounts)
                    } label: {
                        FinancialCard(
                            title: "Bank",
                            amount: viewModel.totalBank,
                            icon: "creditcard.fill",
                            color: .purple
                        )
                    }
                    .buttonStyle(.plain)
                }
                
                // Second row: Income and Profit from Sales
                HStack(spacing: 12) {
                    Button {
                        navPath.append(.revenue)
                    } label: {
                        FinancialCard(
                            title: "Total Revenue",
                            amount: viewModel.totalSalesIncome,
                            icon: "chart.line.uptrend.xyaxis",
                            color: .orange
                        )
                    }
                    .buttonStyle(.plain)
                    
                    Button {
                        navPath.append(.profit)
                    } label: {
                        FinancialCard(
                            title: "Net Profit",
                            amount: viewModel.totalSalesProfit,
                            icon: "dollarsign.circle.fill",
                            color: viewModel.totalSalesProfit >= 0 ? .green : .red
                        )
                    }
                    .buttonStyle(.plain)
                    
                    Button {
                        navPath.append(.sold)
                    } label: {
                        FinancialCard(
                            title: "Sold",
                            amount: Decimal(viewModel.soldCount),
                            icon: "checkmark.circle.fill",
                            color: .cyan,
                            isCount: true
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 20)
            .listRowInsets(EdgeInsets())
        }
        .listRowSeparator(.hidden)
        .listRowBackground(Color.clear)
    }
    var todaysExpensesSection: some View {
        Section {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("Today's Expenses")
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(ColorTheme.primaryText)
                    Spacer()
                    Text("\(viewModel.todaysExpenses.count)")
                        .font(.footnote)
                        .foregroundColor(ColorTheme.secondaryText)
                }

                if viewModel.todaysExpenses.isEmpty {
                    EmptyTodayCard {
                        showingAddExpense = true
                    }
                    .frame(maxWidth: .infinity)
                } else {
                    LazyVGrid(columns: todaysExpenseColumns, spacing: 16) {
                        ForEach(Array(viewModel.todaysExpenses.enumerated()), id: \.element.objectID) { _, expense in
                            TodayExpenseCard(expense: expense) {
                                selectedExpense = expense
                            }
                        }
                    }
                }
            }
            .padding(.vertical, 4)
        }
        .listRowInsets(EdgeInsets(top: 8, leading: 20, bottom: 4, trailing: 20))
        .listRowSeparator(.hidden)
        .listRowBackground(Color.clear)
    }

    var todaysExpenseColumns: [GridItem] {
        [
            GridItem(.flexible(), spacing: 16),
            GridItem(.flexible(), spacing: 16)
        ]
    }

    var summarySection: some View {
        Section {
            VStack(spacing: 16) {
                SummaryOverviewCard(
                    totalSpent: viewModel.totalExpenses,
                    changePercent: viewModel.periodChangePercent,
                    trendPoints: viewModel.trendPoints,
                    range: selectedRange
                )

                CategoryBreakdownCard(stats: viewModel.categoryStats)
            }
            .padding(.vertical, 4)
        }
        .listRowInsets(EdgeInsets(top: 0, leading: 20, bottom: 0, trailing: 20))
        .listRowSeparator(.hidden)
        .listRowBackground(Color.clear)
    }

    var recentExpensesSection: some View {
        Section {
            if viewModel.recentExpenses.isEmpty {
                Text("No recent expenses")
                    .foregroundColor(ColorTheme.secondaryText)
                    .padding(.vertical, 12)
            } else {
                ForEach(Array(viewModel.recentExpenses.enumerated()), id: \.element.objectID) { _, expense in
                    RecentExpenseRow(expense: expense)
                        .onTapGesture {
                            selectedExpense = expense
                        }
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                do {
                                    _ = try expenseEntryViewModel.deleteExpense(expense)
                                    viewModel.fetchFinancialData(range: selectedRange)
                                } catch {
                                    print("Failed to delete expense: \(error)")
                                }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }

                            Button {
                                editingExpense = expense
                            } label: {
                                Label("Edit", systemImage: "pencil")
                            }
                            .tint(ColorTheme.accent)
                        }
                }
            }
        } header: {
            Text("Recent Expenses")
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(ColorTheme.primaryText)
        }
        .textCase(nil)
        .listRowInsets(EdgeInsets(top: 0, leading: 20, bottom: 0, trailing: 20))
        .listRowSeparator(.hidden)
        .listRowBackground(Color.clear)
    }
}

// MARK: - Components

// MARK: - Components

private struct FinancialCard: View {
    let title: String
    let amount: Decimal
    let icon: String
    let color: Color
    var isCount: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.headline)
                    .foregroundColor(color)
                    .frame(width: 28, height: 28)
                    .background(color.opacity(0.1))
                    .clipShape(Circle())
                
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption2)
                    .foregroundColor(ColorTheme.secondaryText)
                    .lineLimit(1)
                
                if isCount {
                    Text("\(NSDecimalNumber(decimal: amount).intValue)")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(ColorTheme.primaryText)
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                } else {
                    Text(amount.asCurrency())
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(ColorTheme.primaryText)
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                }
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(ColorTheme.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 2)
    }
}

private struct TodayExpenseCard: View {
    let expense: Expense
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top) {
                    ZStack {
                        Circle()
                            .fill(ColorTheme.categoryColor(for: expense.category ?? ""))
                            .opacity(0.1)
                            .frame(width: 36, height: 36)
                        Image(systemName: expense.categoryIcon)
                            .font(.subheadline)
                            .foregroundColor(ColorTheme.categoryColor(for: expense.category ?? ""))
                    }
                    
                    Spacer()
                    
                    Text(expense.timeString)
                        .font(.caption2)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(ColorTheme.background)
                        .foregroundColor(ColorTheme.secondaryText)
                        .clipShape(Capsule())
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(expense.amountDecimal.asCurrency())
                        .font(.title3.weight(.bold))
                        .foregroundColor(ColorTheme.primaryText)
                    
                    Text(expense.vehicleTitle)
                        .font(.caption)
                        .foregroundColor(ColorTheme.secondaryText)
                        .lineLimit(1)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, minHeight: 130, alignment: .leading)
            .background(ColorTheme.secondaryBackground)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }
}

private struct EmptyTodayCard: View {
    let addAction: () -> Void

    var body: some View {
        VStack(alignment: .center, spacing: 12) {
            Image(systemName: "list.bullet.clipboard")
                .font(.largeTitle)
                .foregroundColor(ColorTheme.secondaryText.opacity(0.5))
                .padding(.bottom, 4)
            
            Text("No expenses today")
                .font(.headline)
                .foregroundColor(ColorTheme.primaryText)
            
            Button(action: addAction) {
                Text("Add Expense")
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(ColorTheme.primary)
                    .foregroundColor(.white)
                    .clipShape(Capsule())
                    .shadow(color: ColorTheme.primary.opacity(0.3), radius: 4, x: 0, y: 2)
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(ColorTheme.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .shadow(color: Color.black.opacity(0.03), radius: 4, x: 0, y: 2)
    }
}

private struct AddQuickCard: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                Circle()
                    .fill(ColorTheme.primary.opacity(0.1))
                    .frame(width: 48, height: 48)
                    .overlay(
                        Image(systemName: "plus")
                            .font(.title3.weight(.semibold))
                            .foregroundColor(ColorTheme.primary)
                    )
                
                Text("Add New")
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(ColorTheme.primary)
            }
            .frame(maxWidth: .infinity, minHeight: 130)
            .background(ColorTheme.secondaryBackground)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(ColorTheme.primary.opacity(0.1), lineWidth: 1)
                    .padding(1)
            )
        }
        .buttonStyle(.plain)
    }
}

private struct SummaryOverviewCard: View {
    let totalSpent: Decimal
    let changePercent: Double?
    let trendPoints: [TrendPoint]
    let range: DashboardTimeRange

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Total Spent (\(range.displayLabel))")
                        .font(.subheadline)
                        .foregroundColor(ColorTheme.secondaryText)
                    
                    HStack(alignment: .firstTextBaseline, spacing: 12) {
                        Text(totalSpent.asCurrency())
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundColor(ColorTheme.primaryText)
                        
                        if let changePercent {
                            HStack(spacing: 4) {
                                Image(systemName: changePercent >= 0 ? "arrow.up.right" : "arrow.down.right")
                                Text("\(abs(changePercent).formatted(.number.precision(.fractionLength(1))))%")
                            }
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(changePercent >= 0 ? ColorTheme.danger.opacity(0.1) : ColorTheme.success.opacity(0.1))
                            .foregroundColor(changePercent >= 0 ? ColorTheme.danger : ColorTheme.success)
                            .clipShape(Capsule())
                        }
                    }
                }
                Spacer()
            }

            if !trendPoints.isEmpty {
                Chart(trendPoints) { point in
                    AreaMark(
                        x: .value("Date", point.date),
                        y: .value("Amount", point.value)
                    )
                    .interpolationMethod(.catmullRom)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [ColorTheme.primary.opacity(0.2), ColorTheme.primary.opacity(0.0)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )

                    LineMark(
                        x: .value("Date", point.date),
                        y: .value("Amount", point.value)
                    )
                    .interpolationMethod(.catmullRom)
                    .foregroundStyle(ColorTheme.primary)
                    .lineStyle(StrokeStyle(lineWidth: 3))
                }
                .frame(height: 160)
                .chartXAxis(.hidden)
                .chartYAxis(.hidden)
            } else {
                Text("No spending data for this period")
                    .font(.footnote)
                    .foregroundColor(ColorTheme.secondaryText)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 20)
            }
        }
        .padding(24)
        .background(ColorTheme.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 3)
    }
}

private struct CategoryBreakdownCard: View {
    let stats: [CategoryStat]

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text("Spending Breakdown")
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundColor(ColorTheme.primaryText)

            if stats.isEmpty {
                Text("No expenses for this period")
                    .font(.footnote)
                    .foregroundColor(ColorTheme.secondaryText)
                    .padding(.vertical, 12)
            } else {
                VStack(spacing: 16) {
                    ForEach(stats) { stat in
                        CategoryBreakdownRow(stat: stat)
                    }
                }
            }
        }
        .padding(24)
        .background(ColorTheme.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 3)
    }
}

private struct CategoryBreakdownRow: View {
    let stat: CategoryStat

    var body: some View {
        VStack(spacing: 10) {
            HStack {
                HStack(spacing: 12) {
                    Circle()
                        .fill(ColorTheme.categoryColor(for: stat.key))
                        .frame(width: 12, height: 12)
                    Text(stat.title)
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(ColorTheme.primaryText)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text(stat.amount.asCurrency())
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(ColorTheme.primaryText)
                    Text("\(stat.percent, format: .number.precision(.fractionLength(1)))%")
                        .font(.caption2)
                        .foregroundColor(ColorTheme.secondaryText)
                }
            }

            GeometryReader { proxy in
                let width = proxy.size.width * CGFloat(max(stat.percent / 100.0, 0))
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(ColorTheme.background)
                        .frame(height: 6)
                    
                    Capsule()
                        .fill(ColorTheme.categoryColor(for: stat.key))
                        .frame(width: max(width, 6), height: 6)
                }
            }
            .frame(height: 6)
        }
    }
}

private struct RecentExpenseRow: View {
    let expense: Expense

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(ColorTheme.categoryColor(for: expense.category ?? "").opacity(0.1))
                    .frame(width: 48, height: 48)
                Image(systemName: expense.categoryIcon)
                    .font(.headline)
                    .foregroundColor(ColorTheme.categoryColor(for: expense.category ?? ""))
            }

            VStack(alignment: .leading, spacing: 4) {
                let description = expense.expenseDescription?.trimmingCharacters(in: .whitespacesAndNewlines)
                Text((description?.isEmpty == false ? description : nil) ?? expense.categoryTitle)
                    .font(.body.weight(.semibold))
                    .foregroundColor(ColorTheme.primaryText)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Text(expense.vehicleSubtitle)
                        .lineLimit(1)
                    Text("•")
                    Text(expense.dateString)
                }
                .font(.caption)
                .foregroundColor(ColorTheme.secondaryText)
            }

            Spacer()

            Text(expense.amountDecimal.asCurrency())
                .font(.headline)
                .foregroundColor(ColorTheme.primaryText)
        }
        .padding(16)
        .background(ColorTheme.secondaryBackground)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .shadow(color: Color.black.opacity(0.02), radius: 2, x: 0, y: 1)
    }
}

// MARK: - Detail Sheet

private struct ExpenseDetailSheet: View {
    let expense: Expense

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Capsule()
                .fill(ColorTheme.secondaryText.opacity(0.4))
                .frame(width: 48, height: 4)
                .frame(maxWidth: .infinity)
                .padding(.top, 8)

            VStack(alignment: .leading, spacing: 12) {
                let description = expense.expenseDescription?.trimmingCharacters(in: .whitespacesAndNewlines)
                Text((description?.isEmpty == false ? description : nil) ?? expense.categoryTitle)
                    .font(.title3.weight(.semibold))
                Text(expense.amountDecimal.asCurrency())
                    .font(.largeTitle.weight(.bold))
                    .foregroundColor(ColorTheme.primaryText)
            }

            VStack(alignment: .leading, spacing: 10) {
                DetailRow(title: "Category", value: expense.categoryTitle, icon: "tag")
                DetailRow(title: "Vehicle", value: expense.vehicleSubtitle, icon: "car.fill")
                DetailRow(title: "Date", value: expense.dateString, icon: "calendar")
            }

            Spacer()
        }
        .padding(24)
        .background(ColorTheme.background)
    }
}

private struct DetailRow: View {
    let title: String
    let value: String
    let icon: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(ColorTheme.primary)
            VStack(alignment: .leading, spacing: 4) {
                Text(title.uppercased())
                    .font(.caption)
                    .foregroundColor(ColorTheme.secondaryText)
                Text(value)
                    .font(.body)
                    .foregroundColor(ColorTheme.primaryText)
            }
            Spacer()
        }
    }
}

// MARK: - Helpers

private extension DashboardTimeRange {
    static let dashboardFilters: [DashboardTimeRange] = [.today, .week, .month]

    var displayLabel: String {
        switch self {
        case .today: return "Today"
        case .week: return "Week"
        case .month: return "Month"
        case .all: return "All Time"
        }
    }
}

private enum DashboardFormatter {
    static let time: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .none
        formatter.timeStyle = .short
        return formatter
    }()

    static let date: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter
    }()
}

private extension Expense {
    var amountDecimal: Decimal {
        amount?.decimalValue ?? 0
    }

    var categoryTitle: String {
        switch category ?? "" {
        case "vehicle": return "Vehicle"
        case "personal": return "Personal"
        case "employee": return "Employee"
        default: return "Other"
        }
    }

    var categoryIcon: String {
        switch category ?? "" {
        case "vehicle": return "fuelpump"
        case "personal": return "person"
        case "employee": return "briefcase"
        default: return "tag"
        }
    }

    var vehicleTitle: String {
        let make = vehicle?.make ?? ""
        let model = vehicle?.model ?? ""
        let title = [make, model].filter { !$0.isEmpty }.joined(separator: " ")
        return title.isEmpty ? "Any Vehicle" : title
    }

    var vehicleSubtitle: String {
        if let vehicle {
            var components: [String] = []
            let name = [vehicle.make, vehicle.model]
                .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
                .joined(separator: " ")
            if !name.isEmpty {
                components.append(name)
            }
            if let vin = vehicle.vin?.trimmingCharacters(in: .whitespacesAndNewlines), !vin.isEmpty {
                components.append(vin)
            }
            if !components.isEmpty {
                return components.joined(separator: " • ")
            }
        }
        return "No vehicle linked"
    }

    var timeString: String {
        guard let date else { return "--" }
        return DashboardFormatter.time.string(from: date)
    }

    var dateString: String {
        guard let date else { return "--" }
        return DashboardFormatter.date.string(from: date)
    }
}

#Preview {
    DashboardView()
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
}
