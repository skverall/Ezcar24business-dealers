//
//  AddExpenseView.swift
//  Ezcar24Business
//
//  Redesigned form for adding new expenses with a premium feel
//

import SwiftUI
import CoreData
import UIKit

struct AddExpenseView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.managedObjectContext) private var viewContext
    @ObservedObject var viewModel: ExpenseViewModel
    
    // Persistence for last used values
    @AppStorage("lastExpenseCategory") private var lastExpenseCategory: String = "vehicle"
    @AppStorage("lastExpenseVehicleID") private var lastExpenseVehicleID: String = ""
    @AppStorage("lastExpenseUserID") private var lastExpenseUserID: String = ""
    @AppStorage("lastExpenseAccountID") private var lastExpenseAccountID: String = ""

    var editingExpense: Expense? = nil

    // Form State
    @State private var amount = ""
    @State private var date = Date()
    @State private var description = ""
    @State private var category = "vehicle"
    @State private var selectedVehicle: Vehicle?
    @State private var selectedUser: User?
    @State private var selectedAccount: FinancialAccount?

    // UI State
    @State private var showTemplatesSheet: Bool = false
    @State private var showSaveTemplateSheet: Bool = false
    @State private var templateName: String = ""
    @State private var isSaving: Bool = false
    @State private var showSavedToast: Bool = false
    
    // Quick Add States
    @State private var showAddVehicleSheet: Bool = false
    @State private var showAddUserAlert: Bool = false
    @State private var newUserName: String = ""
    @StateObject private var vehicleViewModel: VehicleViewModel
    
    // Sheet Presentation
    @State private var activeSheet: ActiveSheet?
    
    enum ActiveSheet: Identifiable {
        case vehicle, user, account
        var id: Int { hashValue }
    }

    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Vehicle.make, ascending: true)],
        predicate: NSPredicate(format: "status != 'sold' OR status == nil"),
        animation: .default)
    private var vehicles: FetchedResults<Vehicle>

    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \User.name, ascending: true)],
        animation: .default)
    private var users: FetchedResults<User>

    let categoryOptions = [
        ("vehicle", "Vehicle", "car.fill"),
        ("personal", "Personal", "person.fill"),
        ("employee", "Employee", "briefcase.fill"),
        ("office", "Office", "building.fill"),
        ("marketing", "Marketing", "megaphone.fill")
    ]

    var isFormValid: Bool {
        let trimmedAmount = amount.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let val = Decimal(string: trimmedAmount), val > 0 else { return false }
        return true
    }
    
    init(viewModel: ExpenseViewModel, editingExpense: Expense? = nil) {
        self.viewModel = viewModel
        self.editingExpense = editingExpense
        _vehicleViewModel = StateObject(wrappedValue: VehicleViewModel(context: PersistenceController.shared.container.viewContext))
    }

    var body: some View {
        NavigationStack {
            ZStack {
                ColorTheme.background.ignoresSafeArea()
                    .onTapToDismissKeyboard()
                
                VStack(spacing: 0) {
                    // Custom Header
                    headerView
                    
                    ScrollView {
                        VStack(spacing: 24) {
                            // Hero Amount Input
                            amountInputSection
                            
                            // Category Selector
                            categorySelector
                            
                            // Main Details Card
                            detailsCard
                            
                            // Context Selectors (Vehicle, User, Account)
                            contextSection
                            
                            Spacer(minLength: 100) // Space for bottom button
                        }
                        .padding(.vertical, 20)
                    }
                    .scrollDismissesKeyboard(.interactively)
                }
                
                // Floating Save Button
                VStack {
                    Spacer()
                    saveButton
                        .padding(.horizontal, 20)
                        .padding(.bottom, 20)
                }
                
                // Toast Overlay
                if showSavedToast {
                    savedToast
                }
            }
            .sheet(item: $activeSheet) { item in
                switch item {
                case .vehicle: vehicleSelector
                case .user: userSelector
                case .account: accountSelector
                }
            }
            .sheet(isPresented: $showTemplatesSheet) {
                templatesView
            }
            .sheet(isPresented: $showSaveTemplateSheet) {
                saveTemplateView
            }
            .sheet(isPresented: $showAddVehicleSheet) {
                AddVehicleView(viewModel: vehicleViewModel)
            }
            .alert("Add New User", isPresented: $showAddUserAlert) {
                TextField("User Name", text: $newUserName)
                    .textInputAutocapitalization(.words)
                Button("Cancel", role: .cancel) { newUserName = "" }
                Button("Add") { addNewUser() }
            } message: {
                Text("Enter the name of the new user.")
            }
            .onAppear {
                viewModel.refreshFiltersIfNeeded()
                prefillIfNeeded()
            }
        }
    }
    
    // MARK: - UI Components
    
    private var headerView: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(ColorTheme.secondaryText)
                    .frame(width: 36, height: 36)
                    .background(ColorTheme.secondaryBackground)
                    .clipShape(Circle())
            }
            
            Spacer()
            
            Text(editingExpense == nil ? "New Expense" : "Edit Expense")
                .font(.headline)
                .foregroundColor(ColorTheme.primaryText)
            
            Spacer()
            
            Menu {
                Button {
                    showTemplatesSheet = true
                } label: {
                    Label("Quick from Template", systemImage: "bolt.fill")
                }
                Button {
                    showSaveTemplateSheet = true
                } label: {
                    Label("Save as Template", systemImage: "doc.badge.plus")
                }
            } label: {
                Image(systemName: "ellipsis")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(ColorTheme.primary)
                    .frame(width: 36, height: 36)
                    .background(ColorTheme.secondaryBackground)
                    .clipShape(Circle())
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 10)
        .background(ColorTheme.background)
    }
    
    private var amountInputSection: some View {
        VStack(spacing: 8) {
            Text("AMOUNT")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(ColorTheme.secondaryText)
                .tracking(1)
            
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text("AED")
                    .font(.title3)
                    .fontWeight(.semibold)
                    .foregroundColor(ColorTheme.tertiaryText)
                
                TextField("0", text: $amount)
                    .font(.system(size: 56, weight: .bold, design: .rounded))
                    .foregroundColor(ColorTheme.primaryText)
                    .multilineTextAlignment(.center)
                    .keyboardType(.decimalPad)
                    .frame(minWidth: 80)
                    .fixedSize(horizontal: true, vertical: false)
                    .onChange(of: amount) { old, new in
                        let filtered = filterAmountInput(new)
                        if filtered != new { amount = filtered }
                    }
            }
        }
        .padding(.top, 10)
    }
    
    private var categorySelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(categoryOptions, id: \.0) { option in
                    let isSelected = category == option.0
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            category = option.0
                            if category != "vehicle" { selectedVehicle = nil }
                        }
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    } label: {
                        VStack(spacing: 8) {
                            ZStack {
                                Circle()
                                    .fill(isSelected ? ColorTheme.primary : ColorTheme.secondaryBackground)
                                    .frame(width: 56, height: 56)
                                    .shadow(color: isSelected ? ColorTheme.primary.opacity(0.4) : Color.clear, radius: 8, y: 4)
                                
                                Image(systemName: option.2)
                                    .font(.system(size: 24))
                                    .foregroundColor(isSelected ? .white : ColorTheme.secondaryText)
                            }
                            
                            Text(option.1)
                                .font(.caption)
                                .fontWeight(isSelected ? .semibold : .medium)
                                .foregroundColor(isSelected ? ColorTheme.primaryText : ColorTheme.secondaryText)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
        }
    }
    
    private var detailsCard: some View {
        VStack(spacing: 0) {
            // Description Input
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "text.alignleft")
                    .foregroundColor(ColorTheme.secondaryText)
                    .padding(.top, 4)
                
                TextField("What is this for?", text: $description, axis: .vertical)
                    .font(.body)
                    .lineLimit(2...4)
            }
            .padding(16)
            
            Divider()
                .padding(.leading, 44)
            
            // Date Picker
            HStack(spacing: 12) {
                Image(systemName: "calendar")
                    .foregroundColor(ColorTheme.secondaryText)
                
                Text("Date")
                    .font(.body)
                    .foregroundColor(ColorTheme.primaryText)
                
                Spacer()
                
                DatePicker("", selection: $date, displayedComponents: .date)
                    .labelsHidden()
                    .tint(ColorTheme.primary)
            }
            .padding(16)
        }
        .background(ColorTheme.cardBackground)
        .cornerRadius(16)
        .padding(.horizontal, 20)
        .shadow(color: Color.black.opacity(0.03), radius: 10, x: 0, y: 5)
    }
    
    private var contextSection: some View {
        VStack(spacing: 12) {
            if category == "vehicle" {
                contextButton(
                    title: "Vehicle",
                    value: selectedVehicle.map(vehicleDisplayName) ?? "Select Vehicle",
                    icon: "car.fill",
                    isActive: selectedVehicle != nil
                ) {
                    activeSheet = .vehicle
                }
            }
            
            contextButton(
                title: "Paid By",
                value: selectedUser?.name ?? "Select User",
                icon: "person.fill",
                isActive: selectedUser != nil
            ) {
                activeSheet = .user
            }
            
            contextButton(
                title: "Account",
                value: selectedAccount.map(accountDisplayName) ?? "Select Account",
                icon: "creditcard.fill",
                isActive: selectedAccount != nil
            ) {
                activeSheet = .account
            }
        }
        .padding(.horizontal, 20)
    }
    
    private func contextButton(title: String, value: String, icon: String, isActive: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(isActive ? ColorTheme.primary.opacity(0.1) : ColorTheme.secondaryBackground)
                        .frame(width: 44, height: 44)
                    
                    Image(systemName: icon)
                        .font(.system(size: 18))
                        .foregroundColor(isActive ? ColorTheme.primary : ColorTheme.secondaryText)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.caption)
                        .foregroundColor(ColorTheme.secondaryText)
                    Text(value)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(ColorTheme.primaryText)
                        .lineLimit(1)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(ColorTheme.tertiaryText)
            }
            .padding(12)
            .background(ColorTheme.cardBackground)
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isActive ? ColorTheme.primary.opacity(0.3) : Color.clear, lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.02), radius: 5, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }
    
    private var saveButton: some View {
        Button(action: saveExpense) {
            HStack {
                if isSaving {
                    ProgressView()
                        .tint(.white)
                        .padding(.trailing, 8)
                }
                Text(isSaving ? "Saving..." : "Save Expense")
                    .font(.headline)
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(isFormValid ? ColorTheme.primary : ColorTheme.secondaryText.opacity(0.3))
            .cornerRadius(20)
            .shadow(color: isFormValid ? ColorTheme.primary.opacity(0.3) : Color.clear, radius: 10, y: 5)
        }
        .disabled(!isFormValid || isSaving)
    }
    
    private var savedToast: some View {
        VStack {
            Spacer()
            HStack(spacing: 12) {
                Image(systemName: "checkmark.circle.fill")
                .font(.title2)
                .foregroundColor(.green)
                Text("Expense Saved")
                    .font(.headline)
                    .foregroundColor(ColorTheme.primaryText)
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 16)
            .background(ColorTheme.cardBackground)
            .cornerRadius(30)
            .shadow(color: Color.black.opacity(0.1), radius: 20, y: 10)
            .padding(.bottom, 40)
            .transition(.move(edge: .bottom).combined(with: .opacity))
        }
        .zIndex(100)
    }
    
    // MARK: - Selection Sheets
    
    private var vehicleSelector: some View {
        SelectionSheet(title: "Select Vehicle") {
            Button {
                showAddVehicleSheet = true
            } label: {
                HStack {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(ColorTheme.primary)
                    Text("Add New Vehicle")
                        .foregroundColor(ColorTheme.primary)
                        .fontWeight(.medium)
                    Spacer()
                }
                .padding(.vertical, 8)
            }
            
            Button {
                selectedVehicle = nil
                activeSheet = nil
            } label: {
                SelectionRow(title: "None", isSelected: selectedVehicle == nil)
            }
            
            ForEach(vehicles, id: \.objectID) { vehicle in
                Button {
                    selectedVehicle = vehicle
                    activeSheet = nil
                } label: {
                    SelectionRow(
                        title: vehicleDisplayName(vehicle),
                        subtitle: vehicle.vin,
                        isSelected: selectedVehicle?.objectID == vehicle.objectID
                    )
                }
            }
        }
    }
    
    private var userSelector: some View {
        SelectionSheet(title: "Select User") {
            Button {
                showAddUserAlert = true
            } label: {
                HStack {
                    Image(systemName: "plus.circle.fill")
                        .foregroundColor(ColorTheme.primary)
                    Text("Add New User")
                        .foregroundColor(ColorTheme.primary)
                        .fontWeight(.medium)
                    Spacer()
                }
                .padding(.vertical, 8)
            }
            
            Button {
                selectedUser = nil
                activeSheet = nil
            } label: {
                SelectionRow(title: "None", isSelected: selectedUser == nil)
            }
            
            ForEach(users, id: \.objectID) { user in
                Button {
                    selectedUser = user
                    activeSheet = nil
                } label: {
                    SelectionRow(
                        title: user.name ?? "Unknown",
                        isSelected: selectedUser?.objectID == user.objectID
                    )
                }
            }
        }
    }
    
    private var accountSelector: some View {
        SelectionSheet(title: "Select Account") {
            Button {
                selectedAccount = nil
                activeSheet = nil
            } label: {
                SelectionRow(title: "None", isSelected: selectedAccount == nil)
            }
            
            ForEach(viewModel.accounts, id: \.objectID) { account in
                Button {
                    selectedAccount = account
                    activeSheet = nil
                } label: {
                    SelectionRow(
                        title: accountDisplayName(account),
                        isSelected: selectedAccount?.objectID == account.objectID
                    )
                }
            }
        }
    }
    
    // MARK: - Templates Views
    
    private var templatesView: some View {
        NavigationStack {
            List(viewModel.templates, id: \.objectID) { t in
                Button {
                    applyTemplate(t)
                    showTemplatesSheet = false
                } label: {
                    VStack(alignment: .leading) {
                        Text(t.name ?? "Template")
                            .font(.headline)
                        if let cat = t.category {
                            Text(cat.capitalized)
                                .font(.caption)
                                .foregroundColor(ColorTheme.secondaryText)
                        }
                    }
                }
            }
            .navigationTitle("Templates")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { showTemplatesSheet = false }
                }
            }
        }
    }
    
    private var saveTemplateView: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Template Name", text: $templateName)
                } footer: {
                    Text("This will save the current category, vehicle, user, and account as a template.")
                }
            }
            .navigationTitle("Save Template")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showSaveTemplateSheet = false }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveTemplate()
                    }
                    .disabled(templateName.isEmpty)
                }
            }
        }
    }
    
    // MARK: - Logic & Helpers
    
    private func addNewUser() {
        guard !newUserName.isEmpty else { return }
        let user = User(context: viewContext)
        user.id = UUID()
        user.name = newUserName
        user.createdAt = Date()
        user.updatedAt = Date()
        
        do {
            try viewContext.save()
            if let dealerId = CloudSyncEnvironment.currentDealerId {
                Task {
                    await CloudSyncManager.shared?.upsertUser(user, dealerId: dealerId)
                }
            }
            selectedUser = user
            newUserName = ""
            activeSheet = nil // Dismiss selection sheet
        } catch {
            print("Failed to add user: \(error)")
        }
    }
    
    private func filterAmountInput(_ s: String) -> String {
        var result = ""
        var hasDot = false
        var decimals = 0
        for ch in s {
            if ch >= "0" && ch <= "9" {
                if hasDot { if decimals < 2 { result.append(ch); decimals += 1 } else { continue } }
                else { result.append(ch) }
            } else if ch == "." && !hasDot {
                hasDot = true
                result.append(ch)
            }
        }
        return result
    }
    
    private func vehicleDisplayName(_ vehicle: Vehicle) -> String {
        let make = vehicle.make?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let model = vehicle.model?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return [make, model].filter { !$0.isEmpty }.joined(separator: " ")
    }
    
    private func accountDisplayName(_ account: FinancialAccount) -> String {
        let raw = account.accountType?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return raw.isEmpty ? "Account" : raw.capitalized
    }
    
    private func prefillIfNeeded() {
        if let exp = editingExpense {
            if let dec = exp.amount as Decimal? { amount = NSDecimalNumber(decimal: dec).stringValue } else { amount = "" }
            if amount.isEmpty { amount = String(describing: exp.amount ?? 0) }
            date = exp.date ?? Date()
            description = exp.expenseDescription ?? ""
            category = exp.category ?? "vehicle"
            selectedVehicle = exp.vehicle
            selectedUser = exp.user
            selectedAccount = exp.account
        } else {
            // Prefill from last used
            category = lastExpenseCategory
            if !lastExpenseVehicleID.isEmpty {
                selectedVehicle = vehicles.first { $0.id?.uuidString == lastExpenseVehicleID }
            }
            if !lastExpenseUserID.isEmpty {
                selectedUser = users.first { $0.id?.uuidString == lastExpenseUserID }
            }
            if !lastExpenseAccountID.isEmpty {
                selectedAccount = viewModel.accounts.first { $0.objectID.uriRepresentation().absoluteString == lastExpenseAccountID }
            }
        }
    }
    
    private func applyTemplate(_ t: ExpenseTemplate) {
        if let amt = t.defaultAmount?.decimalValue { amount = NSDecimalNumber(decimal: amt).stringValue }
        if let desc = t.defaultDescription { description = desc }
        if let cat = t.category { category = cat }
        selectedVehicle = t.vehicle
        selectedUser = t.user
        selectedAccount = t.account
    }
    
    private func saveTemplate() {
        do {
            try viewModel.saveTemplate(
                name: templateName.isEmpty ? "Template" : templateName,
                category: category,
                vehicle: selectedVehicle,
                user: selectedUser,
                account: selectedAccount,
                defaultAmount: Decimal(string: amount),
                defaultDescription: description.isEmpty ? nil : description
            )
            templateName = ""
            showSaveTemplateSheet = false
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        } catch {
            UINotificationFeedbackGenerator().notificationOccurred(.error)
            print("Failed to save template: \(error)")
        }
    }
    
    private func saveExpense() {
        guard let amountDecimal = Decimal(string: amount), amountDecimal > 0 else { return }
        isSaving = true
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        
        // Simulate network/save delay for better UX feel
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            do {
                if let exp = editingExpense {
                    try viewModel.updateExpense(
                        exp,
                        amount: amountDecimal,
                        date: date,
                        description: description,
                        category: category,
                        vehicle: selectedVehicle,
                        user: selectedUser,
                        account: selectedAccount
                    )
                    
                    if let dealerId = CloudSyncEnvironment.currentDealerId {
                        Task {
                            await CloudSyncManager.shared?.upsertExpense(exp, dealerId: dealerId)
                        }
                    }
                } else {
                    let expense = try viewModel.addExpense(
                        amount: amountDecimal,
                        date: date,
                        description: description,
                        category: category,
                        vehicle: selectedVehicle,
                        user: selectedUser,
                        account: selectedAccount,
                        shouldRefresh: false
                    )
                    viewModel.fetchExpenses()
                    
                    if let dealerId = CloudSyncEnvironment.currentDealerId {
                        Task {
                            await CloudSyncManager.shared?.upsertExpense(expense, dealerId: dealerId)
                        }
                    }
                    
                    // Remember last used
                    lastExpenseCategory = category
                    lastExpenseVehicleID = selectedVehicle?.id?.uuidString ?? ""
                    lastExpenseUserID = selectedUser?.id?.uuidString ?? ""
                    lastExpenseAccountID = selectedAccount?.objectID.uriRepresentation().absoluteString ?? ""
                }
                
                isSaving = false
                showSavedToast = true
                generator.notificationOccurred(.success)
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                    showSavedToast = false
                    dismiss()
                }
            } catch {
                isSaving = false
                generator.notificationOccurred(.error)
                showSavedToast = false
                print("Failed to save expense: \(error)")
            }
        }
    }
}

// MARK: - Helper Views

struct SelectionSheet<Content: View>: View {
    let title: String
    @ViewBuilder let content: () -> Content
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            List {
                content()
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}

struct SelectionRow: View {
    let title: String
    var subtitle: String? = nil
    let isSelected: Bool
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body)
                    .foregroundColor(ColorTheme.primaryText)
                if let subtitle, !subtitle.isEmpty {
                    Text(subtitle)
                    .font(.caption)
                    .foregroundColor(ColorTheme.secondaryText)
                }
            }
            Spacer()
            if isSelected {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(ColorTheme.primary)
                    .font(.title3)
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    let context = PersistenceController.preview.container.viewContext
    let viewModel = ExpenseViewModel(context: context)
    
    return AddExpenseView(viewModel: viewModel)
        .environment(\.managedObjectContext, context)
}
