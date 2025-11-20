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

    func exportExpensesCSV() throws -> URL {
        let expenses = try fetchExpenses()
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

    func generateMonthlyPDF(for month: Date) throws -> URL {
        let range = monthDateRange(for: month)
        let expenses = try fetchExpenses(range: range)
        let vehicles = try fetchVehicles()
        let sales = try fetchSales(range: range)

        let totalExpense = expenses.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) }
        let totalSales = sales.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) }
        let net = totalSales - totalExpense

        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792) // US Letter @72 dpi
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)
        let data = renderer.pdfData { ctx in
            ctx.beginPage()

            let title = "Ezcar24 Monthly Report"
            let attrs: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 22, weight: .bold),
                .foregroundColor: UIColor.label
            ]
            title.draw(at: CGPoint(x: 40, y: 32), withAttributes: attrs)

            let df = DateFormatter()
            df.dateFormat = "MMMM yyyy"
            let subtitle = df.string(from: range.start) + " • Generated \(DateFormatter.localizedString(from: Date(), dateStyle: .medium, timeStyle: .short))"
            subtitle.draw(at: CGPoint(x: 40, y: 60), withAttributes: [
                .font: UIFont.systemFont(ofSize: 14, weight: .medium),
                .foregroundColor: UIColor.secondaryLabel
            ])

            var y: CGFloat = 110
            func writeRow(_ label: String, value: String, accent: UIColor = .label) {
                let labelAttrs: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: 14, weight: .semibold),
                    .foregroundColor: UIColor.secondaryLabel
                ]
                let valueAttrs: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: 16, weight: .semibold),
                    .foregroundColor: accent
                ]
                label.draw(at: CGPoint(x: 40, y: y), withAttributes: labelAttrs)
                value.draw(at: CGPoint(x: 220, y: y), withAttributes: valueAttrs)
                y += 24
            }

            writeRow("Total Expenses", value: totalExpense.asCurrency(), accent: UIColor.systemRed)
            writeRow("Total Sales", value: totalSales.asCurrency(), accent: UIColor.systemGreen)
            writeRow("Net Result", value: net.asCurrency(), accent: net >= 0 ? UIColor.systemGreen : UIColor.systemRed)
            writeRow("Vehicles in inventory", value: "\(vehicles.count)")
            writeRow("Transactions", value: "\(expenses.count) expenses • \(sales.count) sales")

            y += 12
            "Top 5 Expenses".draw(at: CGPoint(x: 40, y: y), withAttributes: [
                .font: UIFont.systemFont(ofSize: 16, weight: .bold),
                .foregroundColor: UIColor.label
            ])
            y += 22

            let topExpenses = expenses.sorted { ($0.amount?.decimalValue ?? 0) > ($1.amount?.decimalValue ?? 0) }.prefix(5)
            let dfRow = DateFormatter()
            dfRow.dateStyle = .medium
            for item in topExpenses {
                let row = "\(dfRow.string(from: item.date ?? Date()))  •  \(item.expenseDescription ?? "No description")"
                row.draw(at: CGPoint(x: 40, y: y), withAttributes: [
                    .font: UIFont.systemFont(ofSize: 12, weight: .regular),
                    .foregroundColor: UIColor.secondaryLabel
                ])
                (item.amount?.decimalValue ?? 0).asCurrency().draw(at: CGPoint(x: 420, y: y), withAttributes: [
                    .font: UIFont.systemFont(ofSize: 12, weight: .semibold),
                    .foregroundColor: UIColor.label
                ])
                y += 18
            }
        }

        let url = makeTempURL(fileName: "monthly-report-\(timestamp()).pdf")
        try data.write(to: url)
        return url
    }

    func createMonthlyArchive(for month: Date, dealerId: UUID?) async throws -> URL {
        let expensesCSV = try exportExpensesCSV()
        let vehiclesCSV = try exportVehiclesCSV()
        let clientsCSV = try exportClientsCSV()
        let pdf = try generateMonthlyPDF(for: month)
        let metadata = try makeMetadataSnapshot(month: month)

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
            month: month,
            metadata: metadata,
            files: try [
                filePayload(for: expensesCSV, contentType: "text/csv"),
                filePayload(for: vehiclesCSV, contentType: "text/csv"),
                filePayload(for: clientsCSV, contentType: "text/csv"),
                filePayload(for: pdf, contentType: "application/pdf")
            ]
        )

        let archiveURL = FileManager.default.temporaryDirectory.appendingPathComponent("ezcar-monthly-\(timestamp()).json")
        try FileManager.default.removeIfExists(at: archiveURL)
        try JSONEncoder().encode(payload).write(to: archiveURL)

        if let dealerId = dealerId {
            await cloudSyncManager?.uploadBackupArchive(at: archiveURL, dealerId: dealerId)
        }

        return archiveURL
    }

    // MARK: - Helpers

    private func fetchExpenses(range: DateInterval? = nil) throws -> [Expense] {
        let request: NSFetchRequest<Expense> = Expense.fetchRequest()
        if let range {
            request.predicate = NSPredicate(format: "date >= %@ AND date < %@", range.start as NSDate, range.end as NSDate)
        }
        var results: [Expense] = []
        var fetchError: Error?
        context.performAndWait {
            do {
                results = try context.fetch(request)
            } catch {
                fetchError = error
            }
        }
        if let fetchError { throw fetchError }
        return results
    }

    private func fetchVehicles() throws -> [Vehicle] {
        let request: NSFetchRequest<Vehicle> = Vehicle.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]
        var results: [Vehicle] = []
        var fetchError: Error?
        context.performAndWait {
            do {
                results = try context.fetch(request)
            } catch {
                fetchError = error
            }
        }
        if let fetchError { throw fetchError }
        return results
    }

    private func fetchClients() throws -> [Client] {
        let request: NSFetchRequest<Client> = Client.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(key: "createdAt", ascending: false)]
        var results: [Client] = []
        var fetchError: Error?
        context.performAndWait {
            do {
                results = try context.fetch(request)
            } catch {
                fetchError = error
            }
        }
        if let fetchError { throw fetchError }
        return results
    }

    private func fetchSales(range: DateInterval? = nil) throws -> [Sale] {
        let request: NSFetchRequest<Sale> = Sale.fetchRequest()
        if let range {
            request.predicate = NSPredicate(format: "date >= %@ AND date < %@", range.start as NSDate, range.end as NSDate)
        }
        var results: [Sale] = []
        var fetchError: Error?
        context.performAndWait {
            do {
                results = try context.fetch(request)
            } catch {
                fetchError = error
            }
        }
        if let fetchError { throw fetchError }
        return results
    }

    private func makeMetadataSnapshot(month: Date) throws -> BackupMetadata {
        let range = monthDateRange(for: month)
        let expenses = try fetchExpenses(range: range)
        let sales = try fetchSales(range: range)

        let totalExpense = expenses.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) }
        let totalSales = sales.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) }
        let categories = Dictionary(grouping: expenses, by: { $0.category ?? "uncategorized" })
            .mapValues { group in group.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) } }

        return BackupMetadata(
            generatedAt: Date(),
            month: month,
            expenseTotal: totalExpense,
            salesTotal: totalSales,
            netResult: totalSales - totalExpense,
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
    let month: Date
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
    let month: Date
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
