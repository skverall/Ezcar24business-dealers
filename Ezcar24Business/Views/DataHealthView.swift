//
//  DataHealthView.swift
//  Ezcar24Business
//
//  Diagnostics for data quality issues
//

import SwiftUI
import CoreData

final class DataHealthViewModel: ObservableObject {
    @Published var noVehicle: [Expense] = []
    @Published var noUser: [Expense] = []
    @Published var emptyDescription: [Expense] = []
    @Published var noDate: [Expense] = []
    @Published var nonPositiveAmount: [Expense] = []
    @Published var invalidCategory: [Expense] = []
    @Published var vehicleCategoryButNoVehicle: [Expense] = []

    private let context: NSManagedObjectContext

    init(context: NSManagedObjectContext) {
        self.context = context
        refresh()
    }

    func refresh() {
        do {
            let req: NSFetchRequest<Expense> = Expense.fetchRequest()
            req.sortDescriptors = [NSSortDescriptor(keyPath: \Expense.date, ascending: false)]
            let all = try context.fetch(req)

            noVehicle = all.filter { $0.vehicle == nil }
            noUser = all.filter { $0.user == nil }
            emptyDescription = all.filter { ($0.expenseDescription?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true) }
            noDate = all.filter { $0.date == nil }
            nonPositiveAmount = all.filter { ($0.amount?.decimalValue ?? 0) <= 0 }

            let allowed = Set(["vehicle", "personal", "employee"]) // extend as needed
            invalidCategory = all.filter { ($0.category ?? "").isEmpty || !allowed.contains(($0.category ?? "").lowercased()) }
            vehicleCategoryButNoVehicle = all.filter { (($0.category ?? "").lowercased() == "vehicle") && $0.vehicle == nil }
        } catch {
            print("DataHealth refresh error: \(error)")
        }
    }
    // MARK: - Quick Fixes
    func fixVehicleCategoryButNoVehicle() {
        for e in vehicleCategoryButNoVehicle {
            // If category says vehicle but no actual vehicle, downgrade to personal
            e.category = "personal"
        }
        saveAndRefresh()
    }

    func fixInvalidCategories() {
        for e in invalidCategory {
            if let _ = e.vehicle {
                e.category = "vehicle"
            } else if let _ = e.user {
                e.category = "employee"
            } else {
                e.category = "personal"
            }
        }
        saveAndRefresh()
    }

    func fixEmptyDatesToToday() {
        for e in noDate {
            e.date = Date()
        }
        saveAndRefresh()
    }

    func fixEmptyDescriptions() {
        for e in emptyDescription {
            e.expenseDescription = "No description"
        }
        saveAndRefresh()
    }

    private func saveAndRefresh() {
        do {
            try context.save()
        } catch {
            print("DataHealth quick fix save error: \(error)")
        }
        refresh()
    }

}

struct DataHealthView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @StateObject private var vm: DataHealthViewModel

    @State private var showingEdit = false
    @State private var editingExpense: Expense? = nil
    @State private var showWarnings: Bool = true


    init() {

        let ctx = PersistenceController.shared.container.viewContext
        _vm = StateObject(wrappedValue: DataHealthViewModel(context: ctx))
    }

    var body: some View {
        List {
            // Filter toggle
            Section {
                Toggle("Show warnings", isOn: $showWarnings)
            }

            // Quick fixes
            Section(header: Text("Quick Fixes")) {
                Button("Fix 'Vehicle category' without vehicle") {
                    vm.fixVehicleCategoryButNoVehicle()
                }
                .disabled(vm.vehicleCategoryButNoVehicle.isEmpty)

                Button("Fix invalid categories") {
                    vm.fixInvalidCategories()
                }
                .disabled(vm.invalidCategory.isEmpty)

                Button("Set today's date for empty dates") {
                    vm.fixEmptyDatesToToday()
                }
                .disabled(vm.noDate.isEmpty)

                Button("Fill empty descriptions") {
                    vm.fixEmptyDescriptions()
                }
                .disabled(vm.emptyDescription.isEmpty)
            }

            // Critical first
            issueSection(title: "Invalid Category", items: vm.invalidCategory)
            issueSection(title: "Vehicle category but no Vehicle", items: vm.vehicleCategoryButNoVehicle)
            issueSection(title: "Non‑positive Amount", items: vm.nonPositiveAmount)
            issueSection(title: "No Date", items: vm.noDate)

            // Optional warnings
            if showWarnings {
                issueSection(title: "No User", items: vm.noUser)
                issueSection(title: "Empty Description", items: vm.emptyDescription)
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Data Health")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button { vm.refresh() } label: { Image(systemName: "arrow.clockwise") }
            }
        }
        .sheet(isPresented: $showingEdit) {
            let evm = ExpenseViewModel(context: PersistenceController.shared.container.viewContext)
            AddExpenseView(viewModel: evm, editingExpense: editingExpense)
        }
    }

    @ViewBuilder
    private func issueSection(title: String, items: [Expense]) -> some View {
        if !items.isEmpty {
            Section(header: Text("\(title) (\(items.count))")) {
                ForEach(items, id: \.objectID) { e in
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(e.expenseDescription ?? "No description")
                                .font(.subheadline)
                                .foregroundColor(ColorTheme.primaryText)
                            HStack(spacing: 8) {
                                if let d = e.date { Text(d, style: .date).font(.caption).foregroundColor(ColorTheme.secondaryText) }
                                if let v = e.vehicle { Text("• \(v.make ?? "") \(v.model ?? "")").font(.caption).foregroundColor(ColorTheme.secondaryText) }
                                if let u = e.user?.name, !u.isEmpty { Text("• \(u)").font(.caption).foregroundColor(ColorTheme.secondaryText) }
                            }
                        }
                        Spacer()
                        Text((e.amount?.decimalValue ?? 0).asCurrency())
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(ColorTheme.danger)
                    }
                    .contentShape(Rectangle())
                    .onTapGesture { editingExpense = e; showingEdit = true }
                    .swipeActions {
                        Button("Edit") { editingExpense = e; showingEdit = true }.tint(ColorTheme.primary)
                        Button(role: .destructive) { delete(e) } label: { Text("Delete") }
                    }
                }
            }
        }
    }

    private func delete(_ expense: Expense) {
        viewContext.delete(expense)
        do {
            try viewContext.save()
        } catch {
            print("Failed to delete in DataHealth: \(error)")
        }
        vm.refresh()
    }
}

#Preview {
    let ctx = PersistenceController.preview.container.viewContext
    return NavigationStack { DataHealthView() }
        .environment(\.managedObjectContext, ctx)
}

