//
//  DashboardViewModel.swift
//  Ezcar24Business
//
//  ViewModel for financial dashboard
//

import Foundation
import CoreData
import Combine


enum DashboardTimeRange: String, CaseIterable, Identifiable {
    case today, week, month, all
    var id: String { rawValue }
    var startDate: Date? {
        let now = Date()
        switch self {
        case .today:
            return Calendar.current.startOfDay(for: now)
        case .week:
            return Calendar.current.date(byAdding: .day, value: -7, to: now)
        case .month:
            return Calendar.current.date(byAdding: .day, value: -30, to: now)
        case .all:
            return nil
        }
    }

    var endDate: Date? {
        let now = Date()
        let calendar = Calendar.current
        switch self {
        case .today:
            let start = calendar.startOfDay(for: now)
            return calendar.date(byAdding: .day, value: 1, to: start)
        case .week, .month:
            return now
        case .all:
            return nil
        }
    }
}

struct CategoryStat: Identifiable {
    let id = UUID()
    let key: String   // e.g., "vehicle", "personal", "employee"
    let title: String
    let amount: Decimal
    let percent: Double
}

struct TrendPoint: Identifiable {
    let id = UUID()
    let date: Date
    let value: Double
}

struct VehicleSpendStat: Identifiable {
    let id = UUID()
    let vehicle: Vehicle
    let title: String
    let amount: Decimal
}


class DashboardViewModel: ObservableObject {
    @Published var totalCash: Decimal = 0
    @Published var totalBank: Decimal = 0
    @Published var totalVehicleValue: Decimal = 0
    @Published var totalExpenses: Decimal = 0
    @Published var vehicleExpenses: Decimal = 0
    @Published var personalExpenses: Decimal = 0
    @Published var employeeExpenses: Decimal = 0
    @Published var vehicleCount: Int = 0
    // Vehicle status counts
    @Published var ownedCount: Int = 0
    @Published var onSaleCount: Int = 0
    @Published var soldCount: Int = 0
    @Published var inTransitCount: Int = 0
    @Published var underServiceCount: Int = 0
    @Published var totalSalesIncome: Decimal = 0

    // Sales performance
    @Published var totalSalesProfit: Decimal = 0
    @Published var soldInPeriod: Int = 0
    @Published var avgProfitPerSale: Decimal = 0

    // Analytics additions
    @Published var categoryStats: [CategoryStat] = []
    @Published var trendPoints: [TrendPoint] = []
    @Published var periodChangePercent: Double? = nil
    @Published var currentRange: DashboardTimeRange = .all
    @Published var periodTransactionCount: Int = 0
    @Published var periodUniqueVehicles: Int = 0

    @Published var todaysExpenses: [Expense] = []
    @Published var recentExpenses: [Expense] = []
    @Published var topVehicles: [VehicleSpendStat] = []


    private var cancellables = Set<AnyCancellable>()

    private let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
        fetchFinancialData(range: .all)
        observeContextChanges()
    }

    private func observeContextChanges() {
        NotificationCenter.default
            .publisher(for: .NSManagedObjectContextObjectsDidChange, object: context)
            .sink { [weak self] notification in
                guard let self, let info = notification.userInfo else { return }
                
                // Check if any relevant entities changed
                if self.shouldRefresh(userInfo: info) {
                    // Debounce or just refresh on main thread
                    DispatchQueue.main.async {
                        self.fetchFinancialData(range: self.currentRange)
                    }
                }
            }
            .store(in: &cancellables)
    }

    private func shouldRefresh(userInfo: [AnyHashable: Any]) -> Bool {
        let keys = [NSInsertedObjectsKey, NSDeletedObjectsKey, NSUpdatedObjectsKey]
        for key in keys {
            guard let objects = userInfo[key] as? Set<NSManagedObject> else { continue }
            if objects.contains(where: { obj in
                obj is Expense || obj is Vehicle || obj is Sale || obj is FinancialAccount
            }) {
                return true
            }
        }
        return false
    }

    func fetchFinancialData(range: DashboardTimeRange = .all) {
        currentRange = range
        let rangeStart = range.startDate
        let rangeEnd = range.endDate
        // Fetch financial accounts
        let accountRequest: NSFetchRequest<FinancialAccount> = FinancialAccount.fetchRequest()

        do {
            let accounts = try context.fetch(accountRequest)
            totalCash = sumAccountBalances(accounts, type: "cash")
            totalBank = sumAccountBalances(accounts, type: "bank")
        } catch {
            print("Error fetching accounts: \(error)")
        }

        // Fetch vehicles
        let vehicleRequest: NSFetchRequest<Vehicle> = Vehicle.fetchRequest()

        do {
            let vehicles = try context.fetch(vehicleRequest)
            vehicleCount = vehicles.count

            // Status counts
            ownedCount = vehicles.filter { $0.status == "owned" }.count
            onSaleCount = vehicles.filter { $0.status == "on_sale" || $0.status == "available" }.count // include legacy
            soldCount = vehicles.filter { $0.status == "sold" }.count
            inTransitCount = vehicles.filter { $0.status == "in_transit" }.count
            underServiceCount = vehicles.filter { $0.status == "under_service" }.count

            // Calculate total vehicle value (purchase price + expenses)
            totalVehicleValue = vehicles.reduce(Decimal(0)) { total, vehicle in
                let purchasePrice = vehicle.purchasePrice?.decimalValue ?? 0
                let vehicleExpenses = (vehicle.expenses as? Set<Expense>)?.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) } ?? 0
                return total + purchasePrice + vehicleExpenses
            }

            // Sales performance metrics
            let soldVehicles = vehicles.filter { ($0.status == "sold") && ($0.salePrice != nil) }
            
            totalSalesIncome = soldVehicles.reduce(Decimal(0)) { acc, v in
                acc + (v.salePrice?.decimalValue ?? 0)
            }

            totalSalesProfit = soldVehicles.reduce(Decimal(0)) { acc, v in
                let sale = v.salePrice?.decimalValue ?? 0
                let buy = v.purchasePrice?.decimalValue ?? 0
                let exp = (v.expenses as? Set<Expense>)?.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) } ?? 0
                return acc + (sale - (buy + exp))
            }

            if let start = rangeStart {
                let end = rangeEnd ?? Date()
                let periodSold = soldVehicles.filter { v in
                    guard let saleDate = v.saleDate else { return false }
                    return saleDate >= start && saleDate < end
                }
                soldInPeriod = periodSold.count
                if soldInPeriod > 0 {
                    let periodProfit = periodSold.reduce(Decimal(0)) { acc, v in
                        let sale = v.salePrice?.decimalValue ?? 0
                        let buy = v.purchasePrice?.decimalValue ?? 0
                        let exp = (v.expenses as? Set<Expense>)?.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) } ?? 0
                        return acc + (sale - (buy + exp))
                    }
                    let divisor = NSDecimalNumber(value: soldInPeriod)
                    avgProfitPerSale = (periodProfit as NSDecimalNumber).dividing(by: divisor).decimalValue
                } else {
                    avgProfitPerSale = 0
                }
            } else {
                // For 'all' range, use all sold vehicles
                soldInPeriod = soldVehicles.count
                if soldInPeriod > 0 {
                    let divisor = NSDecimalNumber(value: soldInPeriod)
                    avgProfitPerSale = (totalSalesProfit as NSDecimalNumber).dividing(by: divisor).decimalValue
                } else {
                    avgProfitPerSale = 0
                }
            }
        } catch {
            print("Error fetching vehicles: \(error)")
        }

        // Fetch expenses (optionally filtered by date range)
        let expenseRequest: NSFetchRequest<Expense> = Expense.fetchRequest()
        let currentStart: Date? = rangeStart
        var currentEnd: Date? = rangeEnd
        if currentStart != nil, currentEnd == nil {
            currentEnd = Date()
        }
        var expensePredicates: [NSPredicate] = []
        if let start = currentStart {
            expensePredicates.append(NSPredicate(format: "date >= %@", start as NSDate))
        }
        if let end = currentEnd {
            expensePredicates.append(NSPredicate(format: "date < %@", end as NSDate))
        }
        if !expensePredicates.isEmpty {
            expenseRequest.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: expensePredicates)
        }

        do {
            let expenses = try context.fetch(expenseRequest)
            totalExpenses = expenses.reduce(0) { $0 + ($1.amount?.decimalValue ?? 0) }

            // KPIs for the selected period
            periodTransactionCount = expenses.count
            let uniqueVehicles = Set(expenses.compactMap { $0.vehicle?.objectID })
            periodUniqueVehicles = uniqueVehicles.count

            vehicleExpenses = expenses.filter { $0.category == "vehicle" }.reduce(0) { $0 + ($1.amount?.decimalValue ?? 0) }
            personalExpenses = expenses.filter { $0.category == "personal" }.reduce(0) { $0 + ($1.amount?.decimalValue ?? 0) }
            employeeExpenses = expenses.filter { $0.category == "employee" }.reduce(0) { $0 + ($1.amount?.decimalValue ?? 0) }

            // Build category stats sorted by amount desc
            let items: [(String,String,Decimal)] = [
                ("vehicle", "Vehicle Expenses", vehicleExpenses),
                ("personal", "Personal Expenses", personalExpenses),
                ("employee", "Employee Expenses", employeeExpenses)
            ]
            let total = (totalExpenses as NSDecimalNumber).doubleValue
            categoryStats = items
                .map { key, title, amount in
                    let amt = (amount as NSDecimalNumber).doubleValue
                    let pct = total > 0 ? (amt / total) * 100.0 : 0
                    return CategoryStat(key: key, title: title, amount: amount, percent: pct)
                }
                .sorted { ($0.amount as NSDecimalNumber).doubleValue > ($1.amount as NSDecimalNumber).doubleValue }

            // Build trend points
            trendPoints = buildTrendPoints(expenses: expenses, range: range)

            // Top Vehicles by spend in selected period (top 3)
            var vehicleSums: [NSManagedObjectID: Decimal] = [:]
            var vehicleRef: [NSManagedObjectID: Vehicle] = [:]
            for e in expenses {
                if let v = e.vehicle {
                    let key = v.objectID
                    vehicleSums[key, default: 0] += (e.amount?.decimalValue ?? 0)
                    vehicleRef[key] = v
                }
            }
            let sorted = vehicleSums.sorted { (a, b) in
                (a.value as NSDecimalNumber).doubleValue > (b.value as NSDecimalNumber).doubleValue
            }
            topVehicles = Array(sorted.prefix(3)).compactMap { (key, sum) in
                guard let v = vehicleRef[key] else { return nil }
                let title = "\(v.make ?? "") \(v.model ?? "")".trimmingCharacters(in: .whitespaces)
                return VehicleSpendStat(vehicle: v, title: title.isEmpty ? "Unnamed Vehicle" : title, amount: sum)
            }

            // Compute change vs previous period (for week/month/today)
            if let start = currentStart, range != .all {
                let end = currentEnd ?? Date()
                let length: TimeInterval = max(end.timeIntervalSince(start), 0)
                let prevStart = start.addingTimeInterval(-length)
                let prevReq: NSFetchRequest<Expense> = Expense.fetchRequest()
                prevReq.predicate = NSPredicate(format: "date >= %@ AND date < %@", prevStart as NSDate, start as NSDate)
                let prevExpenses = try context.fetch(prevReq)
                let prevTotal = prevExpenses.reduce(0) { $0 + ($1.amount?.decimalValue ?? 0) }
                let prev = (prevTotal as NSDecimalNumber).doubleValue

                let curr = (totalExpenses as NSDecimalNumber).doubleValue
                periodChangePercent = prev > 0 ? ((curr - prev) / prev) * 100.0 : nil
            } else {
                periodChangePercent = nil
            }
        } catch {
            print("Error fetching expenses: \(error)")
        }

        loadTodaysExpenses()
        loadRecentExpenses()
    }

    private func sumAccountBalances(_ accounts: [FinancialAccount], type: String) -> Decimal {
        let target = type.lowercased()
        return accounts.reduce(Decimal(0)) { total, account in
            guard account.accountType?.lowercased() == target else { return total }
            return total + (account.balance?.decimalValue ?? 0)
        }
    }

    private func buildTrendPoints(expenses: [Expense], range: DashboardTimeRange) -> [TrendPoint] {
        let cal = Calendar.current
        switch range {
        case .today:
            // Group by hour for today
            let start = cal.startOfDay(for: Date())
            var buckets: [Date: Double] = [:]
            for e in expenses {
                guard let d = e.date, d >= start else { continue }
                if let hourStart = cal.dateInterval(of: .hour, for: d)?.start {
                    let amt = e.amount?.doubleValue ?? 0
                    buckets[hourStart, default: 0] += amt
                }
            }
            return buckets.keys.sorted().map { TrendPoint(date: $0, value: buckets[$0] ?? 0) }
        case .week:
            let start = Calendar.current.date(byAdding: .day, value: -6, to: Date()) ?? Date()
            var pts: [TrendPoint] = []
            for i in 0..<7 {
                if let day = cal.date(byAdding: .day, value: i, to: start) {
                    let sum: Decimal = expenses.filter { $0.date.map { cal.isDate($0, inSameDayAs: day) } ?? false }
                        .reduce(0) { $0 + ($1.amount?.decimalValue ?? 0) }
                    pts.append(TrendPoint(date: day, value: (sum as NSDecimalNumber).doubleValue))
                }
            }
            return pts
        case .month:
            // Group by week number within last ~4 weeks
            let start = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
            var buckets: [Date: Double] = [:]
            for e in expenses {
                guard let d = e.date, d >= start else { continue }
                if let weekStart = cal.dateInterval(of: .weekOfYear, for: d)?.start {
                    let key = weekStart
                    let amt = e.amount?.doubleValue ?? 0
                    buckets[key, default: 0] += amt
                }
            }
            return buckets.keys.sorted().map { TrendPoint(date: $0, value: buckets[$0] ?? 0) }
        case .all:
            // Group by month for all data
            var buckets: [Date: Double] = [:]
            for e in expenses {
                if let d = e.date, let monthStart = cal.dateInterval(of: .month, for: d)?.start {
                    let amt = e.amount?.doubleValue ?? 0
                    buckets[monthStart, default: 0] += amt
                }
            }
            return buckets.keys.sorted().map { TrendPoint(date: $0, value: buckets[$0] ?? 0) }
        }
    }

    private func loadTodaysExpenses() {
        let todayStart = Calendar.current.startOfDay(for: Date())
        let tomorrowStart = Calendar.current.date(byAdding: .day, value: 1, to: todayStart) ?? todayStart
        let request: NSFetchRequest<Expense> = Expense.fetchRequest()
        request.predicate = NSPredicate(format: "date >= %@ AND date < %@", todayStart as NSDate, tomorrowStart as NSDate)
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Expense.date, ascending: false)]

        do {
            todaysExpenses = try context.fetch(request)
        } catch {
            print("Error fetching today's expenses: \(error)")
            todaysExpenses = []
        }
    }

    private func loadRecentExpenses() {
        let request: NSFetchRequest<Expense> = Expense.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Expense.date, ascending: false)]
        request.fetchLimit = 10

        do {
            recentExpenses = try context.fetch(request)
        } catch {
            print("Error fetching recent expenses: \(error)")
            recentExpenses = []
        }
    }
    var averagePerVehicle: Decimal {
        guard periodUniqueVehicles > 0 else { return 0 }
        let total = totalExpenses as NSDecimalNumber
        let divisor = NSDecimalNumber(value: periodUniqueVehicles)
        return total.dividing(by: divisor).decimalValue
    }


    var totalAssets: Decimal {
        totalCash + totalBank + totalVehicleValue
    }

    var netPosition: Decimal {
        totalCash + totalBank
    }
}
