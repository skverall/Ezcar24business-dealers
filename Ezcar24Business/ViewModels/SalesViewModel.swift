//
//  SalesViewModel.swift
//  Ezcar24Business
//
//  Created by Shokhabbos Makhmudov on 20/11/2025.
//

import Foundation
import CoreData
import Combine

class SalesViewModel: ObservableObject {
    @Published var sales: [Sale] = []
    @Published var saleItems: [SaleItem] = []
    @Published var searchText: String = "" {
        didSet {
            fetchSales()
        }
    }

    private let viewContext: NSManagedObjectContext
    private var cancellables = Set<AnyCancellable>()

    init(context: NSManagedObjectContext) {
        self.viewContext = context
        fetchSales()
        observeContextChanges()
    }

    func fetchSales() {
        let request: NSFetchRequest<Sale> = Sale.fetchRequest()

        if !searchText.isEmpty {
            request.predicate = NSPredicate(
                format: "vehicle.make CONTAINS[c] %@ OR vehicle.model CONTAINS[c] %@ OR buyerName CONTAINS[c] %@",
                searchText, searchText, searchText
            )
        }

        request.sortDescriptors = [NSSortDescriptor(keyPath: \Sale.date, ascending: false)]

        do {
            let salesList = try viewContext.fetch(request)
            self.sales = salesList
            self.saleItems = salesList.map { SaleItem(sale: $0) }
        } catch {
            print("Failed to fetch sales: \(error)")
        }
    }

    private func observeContextChanges() {
        NotificationCenter.default
            .publisher(for: .NSManagedObjectContextObjectsDidChange, object: viewContext)
            .sink { [weak self] notification in
                guard let self, let info = notification.userInfo else { return }
                if Self.shouldRefresh(userInfo: info) {
                    DispatchQueue.main.async {
                        self.fetchSales()
                    }
                }
            }
            .store(in: &cancellables)
    }

    private static func shouldRefresh(userInfo: [AnyHashable: Any]) -> Bool {
        let keys = [NSInsertedObjectsKey, NSUpdatedObjectsKey, NSDeletedObjectsKey]
        for key in keys {
            guard let objects = userInfo[key] as? Set<NSManagedObject> else { continue }
            if objects.contains(where: { $0 is Sale || $0 is Vehicle || $0 is Expense }) {
                return true
            }
        }
        return false
    }

    func deleteSale(_ sale: Sale) {
        viewContext.delete(sale)
        do {
            try viewContext.save()
            fetchSales()
        } catch {
            print("Failed to delete sale: \(error)")
        }
    }
}

struct SaleItem: Identifiable {
    let id: NSManagedObjectID
    let sale: Sale
    let vehicleName: String
    let buyerName: String
    let saleDate: Date
    let salePrice: Decimal
    let costPrice: Decimal
    let netProfit: Decimal
    let profitMargin: Double

    init(sale: Sale) {
        self.id = sale.objectID
        self.sale = sale
        self.vehicleName = "\(sale.vehicle?.make ?? "") \(sale.vehicle?.model ?? "")"
        self.buyerName = sale.buyerName ?? "Unknown Buyer"
        self.saleDate = sale.date ?? Date()

        let price = sale.amount?.decimalValue ?? 0
        self.salePrice = price

        // Calculate Cost
        let purchasePrice = sale.vehicle?.purchasePrice?.decimalValue ?? 0
        let expenses = (sale.vehicle?.expenses as? Set<Expense>)?.reduce(Decimal(0)) { $0 + ($1.amount?.decimalValue ?? 0) } ?? 0
        self.costPrice = purchasePrice + expenses

        // Calculate Profit
        self.netProfit = price - self.costPrice

        // Calculate Margin
        if price > 0 {
            self.profitMargin = (NSDecimalNumber(decimal: netProfit).doubleValue / NSDecimalNumber(decimal: price).doubleValue) * 100
        } else {
            self.profitMargin = 0
        }
    }
}
