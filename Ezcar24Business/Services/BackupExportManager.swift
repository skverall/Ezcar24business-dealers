import Foundation
import CoreData
import PDFKit
import UIKit

// Centralized export/backup helper. Creates CSV/PDF snapshots and bundles monthly archives.
final class BackupExportManager: ObservableObject {
    private let context: NSManagedObjectContext
    weak var cloudSyncManager: CloudSyncManager?

    init(context: NSManagedObjectContext, cloudSyncManager: CloudSyncManager? = nil) {
        self.context = context
        self.cloudSyncManager = cloudSyncManager
    }

    // MARK: - Public API

    func exportExpensesCSV(range: DateInterval? = nil) throws -> URL {
        let expenses = try fetchExpenses(range: range)
        var csv = "Date,Description,Category,Amount,Vehicle,User,Account\n"
        let df = DateFormatter()
        df.locale = Locale(identifier: "en_US_POSIX")
        df.dateStyle = .short
        df.timeStyle = .short

        for expense in expenses {
            let dateStr = expense.date.map { df.string(from: $0) } ?? ""
            let desc = expense.expenseDescription ?? ""
            let cat = expense.category ?? ""
            let amt = (expense.amount?.decimalValue ?? 0).asCurrency()
            let vehicle = [expense.vehicle?.make, expense.vehicle?.model].compactMap { $0 }.joined(separator: " ")
            let user = expense.user?.name ?? ""
            let account = expense.account?.accountType ?? ""
            csv += [dateStr, desc, cat, amt, vehicle, user, account]
                .map { "\"\($0.replacingOccurrences(of: "\"", with: "\"\""))\"" }
                .joined(separator: ",") + "\n"
        }

        return try write(content: csv, fileName: "expenses-\(timestamp()).csv")
    }

    func exportVehiclesCSV() throws -> URL {
        let vehicles = try fetchVehicles()
        var csv = "VIN,Make,Model,Year,Purchase Price,Status,Notes,Created At\n"
        let df = ISO8601DateFormatter()
        for vehicle in vehicles {
            let vin = vehicle.vin ?? ""
            let make = vehicle.make ?? ""
            let model = vehicle.model ?? ""
            let year = vehicle.year
            let price = (vehicle.purchasePrice?.decimalValue ?? 0).asCurrency()
            let status = vehicle.status ?? ""
            let notes = vehicle.notes ?? ""
            let created = vehicle.createdAt.map { df.string(from: $0) } ?? ""
            csv += [vin, make, model, "\(year)", price, status, notes, created]
                .map { "\"\($0.replacingOccurrences(of: "\"", with: "\"\""))\"" }
                .joined(separator: ",") + "\n"
        }
        return try write(content: csv, fileName: "vehicles-\(timestamp()).csv")
    }

    func exportClientsCSV() throws -> URL {
        let clients = try fetchClients()
        let df = ISO8601DateFormatter()
        var csv = "Name,Phone,Email,Notes,Created At,Next Reminder\n"
        for client in clients {
            let name = client.name ?? ""
            let phone = client.phone ?? ""
            let email = client.email ?? ""
            let notes = client.notes ?? ""
            let created = client.createdAt.map { df.string(from: $0) } ?? ""
            let reminder = (client.reminders as? Set<ClientReminder>)?.first
            let reminderStr = reminder?.dueDate.map { df.string(from: $0) } ?? ""
            csv += [name, phone, email, notes, created, reminderStr]
                .map { "\"\($0.replacingOccurrences(of: "\"", with: "\"\""))\"" }
                .joined(separator: ",") + "\n"
        }
        return try write(content: csv, fileName: "clients-\(timestamp()).csv")
    }

    func generateReportPDF(for range: DateInterval) throws -> URL {
        let data = try prepareReportData(range: range)
        
        // Previous period for comparison (simple month-over-month for now)
        let previousRange = DateInterval(start: Calendar.current.date(byAdding: .month, value: -1, to: range.start)!, end: range.start)
        let previousData = try? prepareReportData(range: previousRange)
        
        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792) // US Letter
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)
        
        let df = DateFormatter()
        df.dateStyle = .medium
        
        let pdfData = renderer.pdfData { ctx in
            // --- PAGE 1: Executive Summary ---
            ctx.beginPage()
            
            let margin: CGFloat = 40
            var y: CGFloat = 40
            let contentWidth = pageRect.width - (margin * 2)
            
            // Header
            drawHeader(ctx: ctx.cgContext, title: "Business Performance Report", range: range, margin: margin, y: &y, width: contentWidth)
            
            y += 20
            
            // KPI Cards
            drawKPIGrid(data: data, previousData: previousData, margin: margin, y: &y, width: contentWidth)
            
            y += 30
            
            // Inventory Snapshot
            drawSectionTitle("Inventory Status", at: CGPoint(x: margin, y: y))
            y += 25
            drawInventorySnapshot(data: data, margin: margin, y: &y, width: contentWidth)
            
            y += 30
            
            // Alerts / Insights
            drawSectionTitle("AI Insights & Alerts", at: CGPoint(x: margin, y: y))
            y += 25
            drawAlerts(data: data, margin: margin, y: &y, width: contentWidth)
            
            drawFooter(page: 1)
            
            // --- PAGE 2: Deep Dive (Sales & Expenses) ---
            ctx.beginPage()
            y = 40
            drawHeader(ctx: ctx.cgContext, title: "Deep Dive Analysis", range: range, margin: margin, y: &y, width: contentWidth)
            y += 20
            
            // Sales Analytics
            drawSectionTitle("Sales Analytics", at: CGPoint(x: margin, y: y))
            y += 25
            drawSalesAnalytics(data: data, margin: margin, y: &y, width: contentWidth)
            
            y += 30
            
            // Expense Analysis
            drawSectionTitle("Expense Breakdown", at: CGPoint(x: margin, y: y))
            y += 25
            drawExpenseAnalysis(data: data, margin: margin, y: &y, width: contentWidth)
            
            drawFooter(page: 2)
            
            // --- PAGE 3+: Detailed Transactions ---
            ctx.beginPage()
            y = 40
            drawHeader(ctx: ctx.cgContext, title: "Transaction Details", range: range, margin: margin, y: &y, width: contentWidth)
            y += 20
            
            drawTransactionTable(data: data, margin: margin, y: &y, width: contentWidth, pageRect: pageRect, ctx: ctx)
        }
        
        let url = makeTempURL(fileName: "Report-\(df.string(from: range.start))-\(df.string(from: range.end)).pdf")
        try pdfData.write(to: url)
        return url
    }
    
    // MARK: - Drawing Helpers
    
    private func drawHeader(ctx: CGContext, title: String, range: DateInterval, margin: CGFloat, y: inout CGFloat, width: CGFloat) {
        let titleAttrs: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 24, weight: .bold), .foregroundColor: UIColor.black]
        title.draw(at: CGPoint(x: margin, y: y), withAttributes: titleAttrs)
        y += 30
        
        let df = DateFormatter()
        df.dateStyle = .medium
        let dateStr = "\(df.string(from: range.start)) - \(df.string(from: range.end))"
        let subAttrs: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 14, weight: .medium), .foregroundColor: UIColor.darkGray]
        dateStr.draw(at: CGPoint(x: margin, y: y), withAttributes: subAttrs)
        
        let genStr = "Generated: \(DateFormatter.localizedString(from: Date(), dateStyle: .short, timeStyle: .short))"
        let genAttrs: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 10), .foregroundColor: UIColor.lightGray]
        let genSize = genStr.size(withAttributes: genAttrs)
        genStr.draw(at: CGPoint(x: margin + width - genSize.width, y: y), withAttributes: genAttrs)
        
        y += 30
        
        // Divider
        let path = UIBezierPath()
        path.move(to: CGPoint(x: margin, y: y))
        path.addLine(to: CGPoint(x: margin + width, y: y))
        UIColor.systemGray5.setStroke()
        path.lineWidth = 1
        path.stroke()
        y += 20
    }
    
    private func drawKPIGrid(data: ReportData, previousData: ReportData?, margin: CGFloat, y: inout CGFloat, width: CGFloat) {
        let cols = 3
        let cardW = (width - CGFloat(cols - 1) * 10) / CGFloat(cols)
        let cardH: CGFloat = 80
        
        let kpis: [(String, String, UIColor, String?)] = [
            ("Total Sales", data.totalSales.asCurrency(), .systemGreen, previousData.map { calcChange($0.totalSales, data.totalSales) }),
            ("Net Profit", data.netProfit.asCurrency(), data.netProfit >= 0 ? .systemGreen : .systemRed, previousData.map { calcChange($0.netProfit, data.netProfit) }),
            ("Profit Margin", String(format: "%.1f%%", NSDecimalNumber(decimal: data.margin).doubleValue), .label, nil),
            ("Cars Sold", "\(data.soldVehicles.count)", .label, previousData.map { "\($0.soldVehicles.count) -> \(data.soldVehicles.count)" }),
            ("Avg Profit/Car", data.avgProfitPerCar.asCurrency(), .systemBlue, nil),
            ("Avg Days to Sell", "\(data.avgDaysToSell) days", .systemOrange, nil)
        ]
        
        for (i, kpi) in kpis.enumerated() {
            let row = CGFloat(i / cols)
            let col = CGFloat(i % cols)
            let x = margin + col * (cardW + 10)
            let cardY = y + row * (cardH + 10)
            
            // Card bg
            let rect = CGRect(x: x, y: cardY, width: cardW, height: cardH)
            let path = UIBezierPath(roundedRect: rect, cornerRadius: 8)
            UIColor(white: 0.97, alpha: 1).setFill()
            path.fill()
            
            // Title
            kpi.0.draw(at: CGPoint(x: x + 12, y: cardY + 12), withAttributes: [.font: UIFont.systemFont(ofSize: 12, weight: .medium), .foregroundColor: UIColor.secondaryLabel])
            
            // Value
            kpi.1.draw(at: CGPoint(x: x + 12, y: cardY + 32), withAttributes: [.font: UIFont.systemFont(ofSize: 18, weight: .bold), .foregroundColor: kpi.2])
            
            // Change
            if let change = kpi.3 {
                change.draw(at: CGPoint(x: x + 12, y: cardY + 56), withAttributes: [.font: UIFont.systemFont(ofSize: 10), .foregroundColor: UIColor.secondaryLabel])
            }
        }
        
        y += (cardH + 10) * 2
    }
    
    private func calcChange(_ old: Decimal, _ new: Decimal) -> String {
        if old == 0 { return new == 0 ? "0%" : "+100%" }
        let diff = new - old
        let percent = (diff / abs(old)) * 100
        let sign = percent >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.0f", NSDecimalNumber(decimal: percent).doubleValue))%"
    }
    
    private func drawInventorySnapshot(data: ReportData, margin: CGFloat, y: inout CGFloat, width: CGFloat) {
        let items = [
            "Total cars in stock: \(data.inventory.count)",
            "Total value (Capital Locked): \(data.capitalLocked.asCurrency())",
            // Estimated profit is tricky without asking user, maybe assume avg margin? Let's skip or use a placeholder if needed.
            // User asked for "Estimated profit if sold today". We can use avgProfitPerCar * inventory.count as a rough estimate.
            "Est. Profit (based on avg): \((data.avgProfitPerCar * Decimal(data.inventory.count)).asCurrency())"
        ]
        
        for item in items {
            item.draw(at: CGPoint(x: margin, y: y), withAttributes: [.font: UIFont.systemFont(ofSize: 14), .foregroundColor: UIColor.label])
            y += 20
        }
    }
    
    private func drawAlerts(data: ReportData, margin: CGFloat, y: inout CGFloat, width: CGFloat) {
        var alerts: [String] = []
        
        // Logic for alerts
        if data.margin < 5 && data.totalSales > 0 {
            alerts.append("⚠ Low Profit Margin: Only \(String(format: "%.1f", NSDecimalNumber(decimal: data.margin).doubleValue))% (Target > 10%)")
        }
        
        let longHeld = data.inventory.filter {
            guard let date = $0.purchaseDate else { return false }
            return Calendar.current.dateComponents([.day], from: date, to: Date()).day ?? 0 > 45
        }
        if !longHeld.isEmpty {
            alerts.append("⚠ \(longHeld.count) cars held > 45 days. Capital frozen: \(longHeld.reduce(Decimal(0)) { $0 + ($1.purchasePrice?.decimalValue ?? 0) }.asCurrency())")
        }
        
        if alerts.isEmpty {
            "✅ No critical alerts. Business is healthy.".draw(at: CGPoint(x: margin, y: y), withAttributes: [.font: UIFont.systemFont(ofSize: 14), .foregroundColor: UIColor.systemGreen])
            y += 20
        } else {
            for alert in alerts {
                alert.draw(at: CGPoint(x: margin, y: y), withAttributes: [.font: UIFont.systemFont(ofSize: 14, weight: .medium), .foregroundColor: UIColor.systemRed])
                y += 20
            }
        }
    }
    
    private func drawSalesAnalytics(data: ReportData, margin: CGFloat, y: inout CGFloat, width: CGFloat) {
        // Top 3 Profitable
        let sortedByProfit = data.soldVehicles.sorted { v1, v2 in
            let p1 = (v1.salePrice?.decimalValue ?? 0) - (v1.purchasePrice?.decimalValue ?? 0) - totalCostExpenses(v1)
            let p2 = (v2.salePrice?.decimalValue ?? 0) - (v2.purchasePrice?.decimalValue ?? 0) - totalCostExpenses(v2)
            return p1 > p2
        }
        
        "Top 3 Most Profitable:".draw(at: CGPoint(x: margin, y: y), withAttributes: [.font: UIFont.systemFont(ofSize: 14, weight: .bold)])
        y += 20
        
        for (i, v) in sortedByProfit.prefix(3).enumerated() {
            let profit = (v.salePrice?.decimalValue ?? 0) - (v.purchasePrice?.decimalValue ?? 0) - totalCostExpenses(v)
            let name = "\(v.make ?? "") \(v.model ?? "")"
            "\(i+1). \(name) — \(profit.asCurrency())".draw(at: CGPoint(x: margin + 10, y: y), withAttributes: [.font: UIFont.systemFont(ofSize: 14)])
            y += 18
        }
        
        y += 10
        // Loss makers
        let lossMakers = sortedByProfit.filter {
            let profit = ($0.salePrice?.decimalValue ?? 0) - ($0.purchasePrice?.decimalValue ?? 0) - totalCostExpenses($0)
            return profit < 0
        }
        
        if !lossMakers.isEmpty {
            "⚠ Loss Making Sales:".draw(at: CGPoint(x: margin, y: y), withAttributes: [.font: UIFont.systemFont(ofSize: 14, weight: .bold), .foregroundColor: UIColor.systemRed])
            y += 20
            for v in lossMakers {
                let profit = (v.salePrice?.decimalValue ?? 0) - (v.purchasePrice?.decimalValue ?? 0) - totalCostExpenses(v)
                let name = "\(v.make ?? "") \(v.model ?? "")"
                "• \(name) — Loss: \(profit.asCurrency())".draw(at: CGPoint(x: margin + 10, y: y), withAttributes: [.font: UIFont.systemFont(ofSize: 14), .foregroundColor: UIColor.systemRed])
                y += 18
            }
        }
    }
    
    private func drawExpenseAnalysis(data: ReportData, margin: CGFloat, y: inout CGFloat, width: CGFloat) {
        let categories = Dictionary(grouping: data.expenses, by: { $0.category ?? "Misc" })
            .mapValues { $0.reduce(Decimal(0)) { sum, e in sum + (e.amount?.decimalValue ?? 0) } }
            .sorted { $0.value > $1.value }
        
        // Max value for bar chart
        let maxVal = categories.first?.value ?? 1
        
        for (cat, amount) in categories.prefix(8) {
            // Label
            cat.draw(at: CGPoint(x: margin, y: y), withAttributes: [.font: UIFont.systemFont(ofSize: 12)])
            
            // Bar
            let barMaxW = width - 150
            let barW = CGFloat(NSDecimalNumber(decimal: amount / maxVal).doubleValue) * barMaxW
            let barRect = CGRect(x: margin + 80, y: y + 2, width: max(barW, 2), height: 10)
            UIColor.systemBlue.setFill()
            UIBezierPath(roundedRect: barRect, cornerRadius: 2).fill()
            
            // Amount
            amount.asCurrency().draw(at: CGPoint(x: margin + 80 + barW + 10, y: y), withAttributes: [.font: UIFont.systemFont(ofSize: 12, weight: .bold)])
            
            y += 20
        }
    }
    
    private func drawTransactionTable(data: ReportData, margin: CGFloat, y: inout CGFloat, width: CGFloat, pageRect: CGRect, ctx: UIGraphicsPDFRendererContext) {
        // Headers
        let headers = ["Vehicle", "Buy", "Sell", "Exp", "Profit", "Days"]
        let colWidths: [CGFloat] = [width * 0.3, width * 0.15, width * 0.15, width * 0.1, width * 0.15, width * 0.15]
        var x = margin
        
        for (i, h) in headers.enumerated() {
            h.draw(at: CGPoint(x: x, y: y), withAttributes: [.font: UIFont.systemFont(ofSize: 12, weight: .bold), .foregroundColor: UIColor.gray])
            x += colWidths[i]
        }
        y += 20
        
        // Rows
        for vehicle in data.soldVehicles {
            if y > pageRect.height - 50 {
                ctx.beginPage()
                y = 40
                // Redraw headers? Maybe simplified
            }
            
            let buy = vehicle.purchasePrice?.decimalValue ?? 0
            let sell = vehicle.salePrice?.decimalValue ?? 0
            let exp = totalCostExpenses(vehicle)
            let profit = sell - buy - exp
            let days = Calendar.current.dateComponents([.day], from: vehicle.purchaseDate ?? Date(), to: vehicle.saleDate ?? Date()).day ?? 0
            
            let name = "\(vehicle.make ?? "") \(vehicle.model ?? "")"
            
            x = margin
            let rowAttrs: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 10)]
            
            name.draw(at: CGPoint(x: x, y: y), withAttributes: rowAttrs)
            x += colWidths[0]
            
            buy.asCurrency().draw(at: CGPoint(x: x, y: y), withAttributes: rowAttrs)
            x += colWidths[1]
            
            sell.asCurrency().draw(at: CGPoint(x: x, y: y), withAttributes: rowAttrs)
            x += colWidths[2]
            
            exp.asCurrency().draw(at: CGPoint(x: x, y: y), withAttributes: rowAttrs)
            x += colWidths[3]
            
            let profitColor = profit >= 0 ? UIColor.systemGreen : UIColor.systemRed
            profit.asCurrency().draw(at: CGPoint(x: x, y: y), withAttributes: [.font: UIFont.systemFont(ofSize: 10, weight: .bold), .foregroundColor: profitColor])
            x += colWidths[4]
            
            "\(days)".draw(at: CGPoint(x: x, y: y), withAttributes: rowAttrs)
            
            y += 18
        }
    }
    
    private func drawSectionTitle(_ title: String, at point: CGPoint) {
        title.draw(at: point, withAttributes: [.font: UIFont.systemFont(ofSize: 16, weight: .bold)])
    }
    
    private func drawFooter(page: Int) {
        let text = "Ezcar24 Business • Page \(page)"
        let attrs: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 10), .foregroundColor: UIColor.lightGray]
        let size = text.size(withAttributes: attrs)
        text.draw(at: CGPoint(x: 306 - size.width/2, y: 760), withAttributes: attrs)
    }
    
    // Helper to calculate total expenses for a vehicle (needed for profit calc)
    private func totalCostExpenses(_ vehicle: Vehicle) -> Decimal {
        // This should ideally use the relationship, but we can fetch if needed.
        // For PDF generation, we want to be efficient.
        // Assuming 'expenses' relationship is populated.
        if let expenses = vehicle.expenses as? Set<Expense> {
            return expenses.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) }
        }
        return 0
    }

    func createRangeArchive(for range: DateInterval, dealerId: UUID?) async throws -> URL {
        let expensesCSV = try exportExpensesCSV(range: range)
        let vehiclesCSV = try exportVehiclesCSV()
        let clientsCSV = try exportClientsCSV()
        let pdf = try generateReportPDF(for: range)
        let metadata = try makeMetadataSnapshot(range: range)

        func filePayload(for url: URL, contentType: String) throws -> ArchiveFilePayload {
            let data = try Data(contentsOf: url)
            return ArchiveFilePayload(
                name: url.lastPathComponent,
                contentType: contentType,
                base64: data.base64EncodedString()
            )
        }

        let payload = BackupArchivePayload(
            generatedAt: Date(),
            rangeStart: range.start,
            rangeEnd: range.end,
            metadata: metadata,
            files: try [
                filePayload(for: expensesCSV, contentType: "text/csv"),
                filePayload(for: vehiclesCSV, contentType: "text/csv"),
                filePayload(for: clientsCSV, contentType: "text/csv"),
                filePayload(for: pdf, contentType: "application/pdf")
            ]
        )

        let archiveURL = FileManager.default.temporaryDirectory.appendingPathComponent("ezcar-backup-\(timestamp()).json")
        try FileManager.default.removeIfExists(at: archiveURL)
        try JSONEncoder().encode(payload).write(to: archiveURL)

        if let dealerId = dealerId {
            await cloudSyncManager?.uploadBackupArchive(at: archiveURL, dealerId: dealerId)
        }

        return archiveURL
    }

    // MARK: - Helpers

    // MARK: - Data Fetching Helpers

    private func fetchExpenses(range: DateInterval? = nil) throws -> [Expense] {
        let request: NSFetchRequest<Expense> = Expense.fetchRequest()
        if let range {
            request.predicate = NSPredicate(format: "date >= %@ AND date < %@", range.start as NSDate, range.end as NSDate)
        }
        var results: [Expense] = []
        context.performAndWait {
            results = (try? context.fetch(request)) ?? []
        }
        return results
    }

    private func fetchVehicles() throws -> [Vehicle] {
        let request: NSFetchRequest<Vehicle> = Vehicle.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]
        var results: [Vehicle] = []
        context.performAndWait {
            results = (try? context.fetch(request)) ?? []
        }
        return results
    }
    
    private func fetchInventory() throws -> [Vehicle] {
        let request: NSFetchRequest<Vehicle> = Vehicle.fetchRequest()
        request.predicate = NSPredicate(format: "status != %@", "sold")
        var results: [Vehicle] = []
        context.performAndWait {
            results = (try? context.fetch(request)) ?? []
        }
        return results
    }
    
    private func fetchSoldVehicles(range: DateInterval) throws -> [Vehicle] {
        let request: NSFetchRequest<Vehicle> = Vehicle.fetchRequest()
        // Assuming 'saleDate' is the property for when it was sold
        request.predicate = NSPredicate(format: "status == %@ AND saleDate >= %@ AND saleDate < %@", "sold", range.start as NSDate, range.end as NSDate)
        var results: [Vehicle] = []
        context.performAndWait {
            results = (try? context.fetch(request)) ?? []
        }
        return results
    }

    private func fetchClients() throws -> [Client] {
        let request: NSFetchRequest<Client> = Client.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]
        var results: [Client] = []
        context.performAndWait {
            results = (try? context.fetch(request)) ?? []
        }
        return results
    }

    private func fetchSales(range: DateInterval? = nil) throws -> [Sale] {
        let request: NSFetchRequest<Sale> = Sale.fetchRequest()
        if let range {
            request.predicate = NSPredicate(format: "date >= %@ AND date < %@", range.start as NSDate, range.end as NSDate)
        }
        var results: [Sale] = []
        context.performAndWait {
            results = (try? context.fetch(request)) ?? []
        }
        return results
    }
    
    // MARK: - Analytics Calculation
    
    struct ReportData {
        let range: DateInterval
        let soldVehicles: [Vehicle]
        let expenses: [Expense]
        let inventory: [Vehicle]
        
        // KPIs
        var totalSales: Decimal {
            soldVehicles.reduce(Decimal(0)) { $0 + ($1.salePrice?.decimalValue ?? 0) }
        }
        var totalExpenses: Decimal {
            expenses.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) }
        }
        var costOfGoodsSold: Decimal {
            soldVehicles.reduce(Decimal(0)) { $0 + ($1.purchasePrice?.decimalValue ?? 0) }
        }
        // Gross Profit (Sales - COGS)
        var grossProfit: Decimal {
            totalSales - costOfGoodsSold
        }
        // Net Profit (Gross Profit - Expenses)
        var netProfit: Decimal {
            grossProfit - totalExpenses
        }
        var margin: Decimal {
            totalSales > 0 ? (netProfit / totalSales) * 100 : 0
        }
        var avgProfitPerCar: Decimal {
            soldVehicles.isEmpty ? 0 : netProfit / Decimal(soldVehicles.count)
        }
        var roi: Decimal {
            let invested = costOfGoodsSold + totalExpenses
            return invested > 0 ? (netProfit / invested) * 100 : 0
        }
        
        // Inventory
        var capitalLocked: Decimal {
            inventory.reduce(Decimal(0)) { $0 + ($1.purchasePrice?.decimalValue ?? 0) }
        }
        
        // Time
        var avgDaysToSell: Int {
            let days = soldVehicles.compactMap { vehicle -> Int? in
                guard let sold = vehicle.saleDate, let bought = vehicle.purchaseDate else { return nil }
                return Calendar.current.dateComponents([.day], from: bought, to: sold).day
            }
            return days.isEmpty ? 0 : days.reduce(0, +) / days.count
        }
    }
    
    private func prepareReportData(range: DateInterval) throws -> ReportData {
        let sold = try fetchSoldVehicles(range: range)
        let expenses = try fetchExpenses(range: range)
        let inventory = try fetchInventory()
        return ReportData(range: range, soldVehicles: sold, expenses: expenses, inventory: inventory)
    }

    private func makeMetadataSnapshot(range: DateInterval) throws -> BackupMetadata {
        let data = try prepareReportData(range: range)
        
        let categories = Dictionary(grouping: data.expenses, by: { $0.category ?? "uncategorized" })
            .mapValues { group in group.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) } }

        return BackupMetadata(
            generatedAt: Date(),
            rangeStart: range.start,
            rangeEnd: range.end,
            expenseTotal: data.totalExpenses,
            salesTotal: data.totalSales,
            netResult: data.netProfit,
            expenseTotalsByCategory: categories
        )
    }

    private func write(content: String, fileName: String) throws -> URL {
        let url = makeTempURL(fileName: fileName)
        try content.write(to: url, atomically: true, encoding: .utf8)
        return url
    }

    private func makeTempURL(fileName: String) -> URL {
        FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
    }

    private func timestamp() -> String {
        let df = DateFormatter()
        df.dateFormat = "yyyyMMdd-HHmmss"
        return df.string(from: Date())
    }

    private func monthDateRange(for date: Date) -> DateInterval {
        let cal = Calendar.current
        let start = cal.date(from: cal.dateComponents([.year, .month], from: date)) ?? date
        let end = cal.date(byAdding: .month, value: 1, to: start) ?? date
        return DateInterval(start: start, end: end)
    }
}

struct BackupMetadata: Codable {
    let generatedAt: Date
    let rangeStart: Date
    let rangeEnd: Date
    let expenseTotal: Decimal
    let salesTotal: Decimal
    let netResult: Decimal
    let expenseTotalsByCategory: [String: Decimal]
}

struct ArchiveFilePayload: Codable {
    let name: String
    let contentType: String
    let base64: String
}

struct BackupArchivePayload: Codable {
    let generatedAt: Date
    let rangeStart: Date
    let rangeEnd: Date
    let metadata: BackupMetadata
    let files: [ArchiveFilePayload]
}

private extension FileManager {
    func removeIfExists(at url: URL) throws {
        if fileExists(atPath: url.path) {
            try removeItem(at: url)
        }
    }
}
