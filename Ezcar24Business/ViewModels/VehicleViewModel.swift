//
//  VehicleViewModel.swift
//  Ezcar24Business
//
//  ViewModel for vehicle management
//

import Foundation
import CoreData
import Combine

class VehicleViewModel: ObservableObject {
    @Published var displayMode: DisplayMode = .inventory
    @Published var vehicles: [Vehicle] = []
    @Published var selectedStatus: String = "all"
    @Published var searchText: String = ""
    @Published var sortOption: SortOption = .dateDesc

    enum DisplayMode: String, CaseIterable, Identifiable {
        case inventory = "Inventory"
        case sold = "Sold"
        
        var id: String { self.rawValue }
    }

    enum SortOption: String, CaseIterable, Identifiable {
        case dateDesc = "Newest First"
        case dateAsc = "Oldest First"
        case priceDesc = "Price: High to Low"
        case priceAsc = "Price: Low to High"
        
        var id: String { self.rawValue }
    }

    private let context: NSManagedObjectContext
    private var cancellables = Set<AnyCancellable>()


    init(context: NSManagedObjectContext) {
        self.context = context
        fetchVehicles()
        fetchVehicles()
        // observeContextChanges() // Disabled to prevent aggressive refreshes causing UI lag
        
        // Debounce search
        $searchText
            .debounce(for: .milliseconds(300), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] _ in
                self?.fetchVehicles()
            }
            .store(in: &cancellables)
            
        // React to sort changes
        $sortOption
            .sink { [weak self] _ in
                // Small delay to allow state update before fetch
                DispatchQueue.main.async {
                    self?.fetchVehicles()
                }
            }
            .store(in: &cancellables)

        // React to status filter changes
        $selectedStatus
            .sink { [weak self] _ in
                DispatchQueue.main.async {
                    self?.fetchVehicles()
                }
            }
            .store(in: &cancellables)
            
        // React to display mode changes
        $displayMode
            .sink { [weak self] _ in
                DispatchQueue.main.async {
                    self?.fetchVehicles()
                }
            }
            .store(in: &cancellables)
    }


    func fetchVehicles() {
        let request: NSFetchRequest<Vehicle> = Vehicle.fetchRequest()
        
        // Sorting
        switch sortOption {
        case .dateDesc:
            request.sortDescriptors = [NSSortDescriptor(keyPath: \Vehicle.createdAt, ascending: false)]
        case .dateAsc:
            request.sortDescriptors = [NSSortDescriptor(keyPath: \Vehicle.createdAt, ascending: true)]
        case .priceDesc:
            request.sortDescriptors = [NSSortDescriptor(keyPath: \Vehicle.purchasePrice, ascending: false)]
        case .priceAsc:
            request.sortDescriptors = [NSSortDescriptor(keyPath: \Vehicle.purchasePrice, ascending: true)]
        }

        // Filtering
        var predicates: [NSPredicate] = []
        
        // Display Mode Filter (Inventory vs Sold)
        if displayMode == .inventory {
            predicates.append(NSPredicate(format: "status != %@", "sold"))
            
            // Status Filter (Only applies in Inventory mode)
            if selectedStatus != "all" {
                if selectedStatus == "on_sale" {
                    predicates.append(NSCompoundPredicate(orPredicateWithSubpredicates: [
                        NSPredicate(format: "status == %@", "on_sale"),
                        NSPredicate(format: "status == %@", "available")
                    ]))
                } else {
                    predicates.append(NSPredicate(format: "status == %@", selectedStatus))
                }
            }
        } else {
            // Sold Mode
            predicates.append(NSPredicate(format: "status == %@", "sold"))
        }
        
        // Search Filter
        if !searchText.isEmpty {
            let search = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
            let searchPredicate = NSCompoundPredicate(orPredicateWithSubpredicates: [
                NSPredicate(format: "make CONTAINS[cd] %@", search),
                NSPredicate(format: "model CONTAINS[cd] %@", search),
                NSPredicate(format: "vin CONTAINS[cd] %@", search)
            ])
            predicates.append(searchPredicate)
        }
        
        if !predicates.isEmpty {
            request.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
        }

        do {
            vehicles = try context.fetch(request)
        } catch {
            print("Error fetching vehicles: \(error)")
        }
    }

    // Optional imageData will be saved to disk (not Core Data) to avoid bloat and keep UI fast.
    @discardableResult
    func addVehicle(
        vin: String,
        make: String,
        model: String,
        year: Int32,
        purchasePrice: Decimal,
        purchaseDate: Date,
        status: String,
        notes: String,
        imageData: Data? = nil,
        salePrice: Decimal? = nil,
        saleDate: Date? = nil
    ) -> Vehicle {
        let vehicle = Vehicle(context: context)
        vehicle.id = UUID()
        vehicle.vin = vin
        vehicle.make = make
        vehicle.model = model
        vehicle.year = year
        vehicle.purchasePrice = NSDecimalNumber(decimal: purchasePrice)
        vehicle.purchaseDate = purchaseDate
        vehicle.status = status
        vehicle.notes = notes
        vehicle.createdAt = Date()
        if let salePrice { vehicle.salePrice = NSDecimalNumber(decimal: salePrice) }
        if let saleDate { vehicle.saleDate = saleDate }

        // Persist Core Data first
        saveContext()

        // Save image (if any) in background associated with the newly created id
        if let data = imageData, let id = vehicle.id {
            ImageStore.shared.save(imageData: data, for: id)
        }

        fetchVehicles()
        return vehicle
    }

    @discardableResult
    func deleteVehicle(_ vehicle: Vehicle) -> UUID? {
        let id = vehicle.id
        context.delete(vehicle)
        saveContext()
        fetchVehicles()
        return id
    }


    func duplicateVehicle(_ original: Vehicle) {
        let new = Vehicle(context: context)
        new.id = UUID()
        new.vin = "" // avoid VIN duplicates
        new.make = original.make
        new.model = original.model
        new.year = original.year
        new.purchasePrice = original.purchasePrice
        new.purchaseDate = original.purchaseDate
        new.status = original.status
        new.notes = original.notes
        new.createdAt = Date()
        // Do not copy sale details by default
        new.salePrice = nil
        new.saleDate = nil
        saveContext()
        // Copy photo if exists
        if let oldID = original.id, let newID = new.id, ImageStore.shared.hasImage(id: oldID) {
            let url = ImageStore.shared.imageURL(for: oldID)
            if let data = try? Data(contentsOf: url) {
                ImageStore.shared.save(imageData: data, for: newID)
            }
        }
        fetchVehicles()
    }

    func totalCost(for vehicle: Vehicle) -> Decimal {
        let purchasePrice = vehicle.purchasePrice as Decimal? ?? 0
        
        // Try relationship first
        if let expensesSet = vehicle.expenses as? Set<Expense>, !expensesSet.isEmpty {
             return purchasePrice + expensesSet.reduce(0) { $0 + ($1.amount as Decimal? ?? 0) }
        }

        // Fallback to fetch if relationship is empty (workaround for bug)
        let request: NSFetchRequest<Expense> = Expense.fetchRequest()
        request.predicate = NSPredicate(format: "vehicle == %@", vehicle)
        
        do {
            let fetchedExpenses = try context.fetch(request)
            let expensesTotal = fetchedExpenses.reduce(0) { $0 + ($1.amount as Decimal? ?? 0) }
            return purchasePrice + expensesTotal
        } catch {
            print("Error fetching expenses for total cost: \(error)")
            return purchasePrice
        }
    }

    func expenseCount(for vehicle: Vehicle) -> Int {
        if let expensesSet = vehicle.expenses as? Set<Expense>, !expensesSet.isEmpty {
            return expensesSet.count
        }
        
        let request: NSFetchRequest<Expense> = Expense.fetchRequest()
        request.predicate = NSPredicate(format: "vehicle == %@", vehicle)
        
        do {
            return try context.count(for: request)
        } catch {
            return 0
        }
    }

    private func observeContextChanges() {
        NotificationCenter.default
            .publisher(for: .NSManagedObjectContextObjectsDidChange, object: context)
            .sink { [weak self] notification in
                guard let self, let userInfo = notification.userInfo else { return }
                if Self.shouldRefreshVehicles(userInfo: userInfo) {
                    self.fetchVehicles()
                }
            }
            .store(in: &cancellables)
    }

    private static func shouldRefreshVehicles(userInfo: [AnyHashable: Any]) -> Bool {
        let keys = [NSInsertedObjectsKey, NSUpdatedObjectsKey, NSDeletedObjectsKey]
        for key in keys {
            guard let objects = userInfo[key] as? Set<NSManagedObject> else { continue }
            if objects.contains(where: { $0 is Vehicle || $0 is Expense }) {
                return true
            }
        }
        return false
    }

    private func saveContext() {
        do {
            try context.save()
        } catch {
            print("Error saving context: \(error)")
        }
    }
}
