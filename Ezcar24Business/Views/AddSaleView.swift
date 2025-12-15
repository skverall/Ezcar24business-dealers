//
//  AddSaleView.swift
//  Ezcar24Business
//
//  Created by Shokhabbos Makhmudov on 20/11/2025.
//

import SwiftUI
import CoreData

struct AddSaleView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    
    // Form State
    @State private var selectedVehicle: Vehicle?
    @State private var amount: String = ""
    @State private var date: Date = Date()
    @State private var buyerName: String = ""
    @State private var buyerPhone: String = ""
    @State private var paymentMethod: String = "Cash"
    @State private var notes: String = ""
    
    // UI State
    @State private var showVehicleSheet: Bool = false
    @State private var isSaving: Bool = false
    @State private var showSavedToast: Bool = false
    @State private var saveError: String? = nil
    
    let paymentMethods = ["Cash", "Bank Transfer", "Cheque", "Finance", "Other"]
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Vehicle.make, ascending: true)],
        predicate: NSPredicate(format: "status != 'sold'"),
        animation: .default)
    private var vehicles: FetchedResults<Vehicle>

    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \FinancialAccount.accountType, ascending: true)],
        animation: .default)
    private var accounts: FetchedResults<FinancialAccount>

    @State private var selectedAccount: FinancialAccount?
    
    // Computed Properties for Financial Preview
    var purchasePrice: Decimal {
        selectedVehicle?.purchasePrice?.decimalValue ?? 0
    }
    
    var totalExpenses: Decimal {
        guard let v = selectedVehicle, let expenses = v.expenses as? Set<Expense> else { return 0 }
        return expenses.reduce(0) { $0 + ($1.amount?.decimalValue ?? 0) }
    }
    
    var totalCost: Decimal {
        purchasePrice + totalExpenses
    }
    
    var salePrice: Decimal {
        Decimal(string: amount.filter { "0123456789.".contains($0) }) ?? 0
    }
    
    var estimatedProfit: Decimal {
        salePrice - totalCost
    }
    
    var isFormValid: Bool {
        selectedVehicle != nil && salePrice > 0 && !buyerName.isEmpty
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                ColorTheme.background.ignoresSafeArea()
                    .onTapToDismissKeyboard()
                
                VStack(spacing: 0) {
                    // Header
                    headerView
                    
                    ScrollView {
                        VStack(spacing: 24) {
                            // Vehicle Selection
                            vehicleSelectionSection
                            
                            // Financial Preview Card (only if vehicle selected)
                            if selectedVehicle != nil {
                                financialPreviewCard
                            }
                            
                            // Sale Details
                            saleDetailsSection

                            // Account Selection
                            accountSelectionSection
                            
                            // Buyer Details
                            buyerDetailsSection
                            
                            Spacer(minLength: 100)
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
                // .ignoresSafeArea(.keyboard) - Removed to allow button to move up
                
                // Toast Overlay
                if showSavedToast {
                    savedToast
                }
            }
            .sheet(isPresented: $showVehicleSheet) {
                vehicleSelectionSheet
            }
            .onAppear {
                if accounts.isEmpty {
                    createDefaultAccounts()
                }
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
            
            Text("New Sale")
                .font(.headline)
                .foregroundColor(ColorTheme.primaryText)
            
            Spacer()
            
            // Placeholder for balance
            Color.clear.frame(width: 36, height: 36)
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 10)
        .background(ColorTheme.background)
    }
    
    private var vehicleSelectionSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("VEHICLE")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(ColorTheme.secondaryText)
                .tracking(1)
                .padding(.horizontal, 20)
            
            Button {
                showVehicleSheet = true
            } label: {
                HStack(spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(selectedVehicle != nil ? ColorTheme.primary.opacity(0.1) : ColorTheme.secondaryBackground)
                            .frame(width: 48, height: 48)
                        
                        Image(systemName: "car.fill")
                            .font(.system(size: 20))
                            .foregroundColor(selectedVehicle != nil ? ColorTheme.primary : ColorTheme.secondaryText)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        if let vehicle = selectedVehicle {
                            Text("\(vehicle.make ?? "") \(vehicle.model ?? "")")
                                .font(.headline)
                                .foregroundColor(ColorTheme.primaryText)
                            Text(vehicle.vin ?? "No VIN")
                                .font(.caption)
                                .foregroundColor(ColorTheme.secondaryText)
                        } else {
                            Text("Select Vehicle")
                                .font(.headline)
                                .foregroundColor(ColorTheme.primaryText)
                            Text("Tap to choose from inventory")
                                .font(.caption)
                                .foregroundColor(ColorTheme.secondaryText)
                        }
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(ColorTheme.tertiaryText)
                }
                .padding(16)
                .background(ColorTheme.cardBackground)
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.03), radius: 8, x: 0, y: 4)
            }
            .padding(.horizontal, 20)
        }
    }
    
    private var financialPreviewCard: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Financial Preview")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(ColorTheme.secondaryText)
                Spacer()
            }
            
            HStack(spacing: 20) {
                financialMetric(title: "Total Cost", amount: totalCost, color: ColorTheme.primaryText)
                
                Divider()
                
                financialMetric(title: "Sale Price", amount: salePrice, color: ColorTheme.primary)
                
                Divider()
                
                financialMetric(
                    title: "Est. Profit",
                    amount: estimatedProfit,
                    color: estimatedProfit >= 0 ? ColorTheme.success : ColorTheme.danger
                )
            }
        }
        .padding(16)
        .background(ColorTheme.cardBackground)
        .cornerRadius(16)
        .padding(.horizontal, 20)
        .shadow(color: Color.black.opacity(0.03), radius: 8, x: 0, y: 4)
    }
    
    private func financialMetric(title: String, amount: Decimal, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(ColorTheme.secondaryText)
            Text(amount.asCurrency())
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    private var saleDetailsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("SALE DETAILS")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(ColorTheme.secondaryText)
                .tracking(1)
                .padding(.horizontal, 20)
            
            VStack(spacing: 0) {
                // Amount Input
                HStack(spacing: 12) {
                    Text("AED")
                        .font(.headline)
                        .foregroundColor(ColorTheme.tertiaryText)
                        .frame(width: 40)
                    
                    TextField("Sale Amount", text: $amount)
                        .keyboardType(.decimalPad)
                        .font(.headline)
                        .onChange(of: amount) { old, new in
                            let filtered = new.filter { "0123456789.".contains($0) }
                            if filtered != new { amount = filtered }
                        }
                }
                .padding(16)
                
                Divider().padding(.leading, 20)
                
                // Date Picker
                HStack(spacing: 12) {
                    Image(systemName: "calendar")
                        .foregroundColor(ColorTheme.secondaryText)
                        .frame(width: 24)
                    
                    Text("Sale Date")
                        .font(.body)
                        .foregroundColor(ColorTheme.primaryText)
                    
                    Spacer()
                    
                    DatePicker("", selection: $date, displayedComponents: .date)
                        .labelsHidden()
                }
                .padding(16)
                
                Divider().padding(.leading, 20)
                
                // Payment Method
                HStack(spacing: 12) {
                    Image(systemName: "creditcard")
                        .foregroundColor(ColorTheme.secondaryText)
                        .frame(width: 24)
                    
                    Text("Payment")
                        .font(.body)
                        .foregroundColor(ColorTheme.primaryText)
                    
                    Spacer()
                    
                    Picker("Payment", selection: $paymentMethod) {
                        ForEach(paymentMethods, id: \.self) { method in
                            Text(method).tag(method)
                        }
                    }
                    .pickerStyle(.menu)
                    .accentColor(ColorTheme.primary)
                }
                .padding(16)
            }
            .background(ColorTheme.cardBackground)
            .cornerRadius(16)
            .padding(.horizontal, 20)
            .shadow(color: Color.black.opacity(0.03), radius: 8, x: 0, y: 4)
        }
    }

    private var accountSelectionSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("DEPOSIT TO")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(ColorTheme.secondaryText)
                .tracking(1)
                .padding(.horizontal, 20)
            
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    Image(systemName: "building.columns.fill")
                        .foregroundColor(ColorTheme.secondaryText)
                        .frame(width: 24)
                    
                    Text("Account")
                        .font(.body)
                        .foregroundColor(ColorTheme.primaryText)
                    
                    Spacer()
                    
                    Picker("Account", selection: $selectedAccount) {
                        Text("None").tag(nil as FinancialAccount?)
                        ForEach(accounts) { account in
                            Text(account.accountType ?? "Unknown").tag(account as FinancialAccount?)
                        }
                    }
                    .pickerStyle(.menu)
                    .accentColor(ColorTheme.primary)
                }
                .padding(16)
            }
            .background(ColorTheme.cardBackground)
            .cornerRadius(16)
            .padding(.horizontal, 20)
            .shadow(color: Color.black.opacity(0.03), radius: 8, x: 0, y: 4)
        }
    }
    
    private var buyerDetailsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("BUYER INFO")
                .font(.caption2)
                .fontWeight(.bold)
                .foregroundColor(ColorTheme.secondaryText)
                .tracking(1)
                .padding(.horizontal, 20)
            
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    Image(systemName: "person.fill")
                        .foregroundColor(ColorTheme.secondaryText)
                        .frame(width: 24)
                    
                    TextField("Buyer Name", text: $buyerName)
                }
                .padding(16)
                
                Divider().padding(.leading, 52)
                
                HStack(spacing: 12) {
                    Image(systemName: "phone.fill")
                        .foregroundColor(ColorTheme.secondaryText)
                        .frame(width: 24)
                    
                    TextField("Phone Number", text: $buyerPhone)
                        .keyboardType(.phonePad)
                }
                .padding(16)
                
                Divider().padding(.leading, 52)
                
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "note.text")
                        .foregroundColor(ColorTheme.secondaryText)
                        .frame(width: 24)
                        .padding(.top, 4)
                    
                    TextField("Notes (Optional)", text: $notes, axis: .vertical)
                        .lineLimit(2...4)
                }
                .padding(16)
            }
            .background(ColorTheme.cardBackground)
            .cornerRadius(16)
            .padding(.horizontal, 20)
            .shadow(color: Color.black.opacity(0.03), radius: 8, x: 0, y: 4)
        }
    }
    
    private var saveButton: some View {
        Button(action: saveSale) {
            HStack {
                if isSaving {
                    ProgressView()
                        .tint(.white)
                        .padding(.trailing, 8)
                }
                Text(isSaving ? "Saving..." : "Complete Sale")
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
                Text("Sale Recorded Successfully")
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
    
    private var vehicleSelectionSheet: some View {
        NavigationStack {
            List {
                if vehicles.isEmpty {
                    Text("No vehicles available for sale.")
                        .foregroundColor(ColorTheme.secondaryText)
                        .padding()
                } else {
                    ForEach(vehicles) { vehicle in
                        Button {
                            selectedVehicle = vehicle
                            showVehicleSheet = false
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("\(vehicle.make ?? "") \(vehicle.model ?? "")")
                                        .font(.headline)
                                        .foregroundColor(ColorTheme.primaryText)
                                    Text("VIN: \(vehicle.vin ?? "N/A")")
                                        .font(.caption)
                                        .foregroundColor(ColorTheme.secondaryText)
                                }
                                Spacer()
                                if selectedVehicle == vehicle {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(ColorTheme.primary)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
            .navigationTitle("Select Vehicle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showVehicleSheet = false }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
    
    // MARK: - Logic
    
    private func saveSale() {
        guard let vehicle = selectedVehicle else { return }
        
        isSaving = true
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        
        // Simulate delay for UX
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            do {
                // 1. Create Sale Record
                let newSale = Sale(context: viewContext)
                newSale.id = UUID()
                newSale.vehicle = vehicle
                newSale.amount = NSDecimalNumber(decimal: salePrice)
                newSale.date = date
                newSale.buyerName = buyerName
                newSale.buyerPhone = buyerPhone
                newSale.paymentMethod = paymentMethod
                newSale.createdAt = Date()
                newSale.updatedAt = newSale.createdAt

                
                // 2. Update Vehicle Status
                vehicle.status = "sold"
                vehicle.salePrice = NSDecimalNumber(decimal: salePrice)
                vehicle.saleDate = date
                vehicle.buyerName = buyerName
                vehicle.buyerPhone = buyerPhone
                vehicle.paymentMethod = paymentMethod
                if !notes.isEmpty {
                    // Append sale notes to vehicle notes or replace?
                    // Let's append for history
                    let currentNotes = vehicle.notes ?? ""
                    let newNote = "\n[Sale Note]: \(notes)"
                    vehicle.notes = currentNotes + newNote
                }
                vehicle.updatedAt = Date()
                
                // 3. Update Account Balance
                if let account = selectedAccount {
                    let currentBalance = account.balance?.decimalValue ?? 0
                    account.balance = NSDecimalNumber(decimal: currentBalance + salePrice)
                    account.updatedAt = Date()
                }
                
                try viewContext.save()
                
                // 4. Cloud Sync
                if let dealerId = CloudSyncEnvironment.currentDealerId {
                    Task {
                        await CloudSyncManager.shared?.upsertSale(newSale, dealerId: dealerId)
                        await CloudSyncManager.shared?.upsertVehicle(vehicle, dealerId: dealerId)
                        
                        if let account = selectedAccount {
                            await CloudSyncManager.shared?.upsertFinancialAccount(account, dealerId: dealerId)
                        }
                    }
                }
                
                generator.notificationOccurred(.success)
                withAnimation {
                    showSavedToast = true
                }
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    dismiss()
                }
                
            } catch {
                isSaving = false
                generator.notificationOccurred(.error)
                print("Failed to save sale: \(error)")
            }
        }
    }
    
    private func createDefaultAccounts() {
        let cash = FinancialAccount(context: viewContext)
        cash.id = UUID()
        cash.accountType = "Cash"
        cash.balance = NSDecimalNumber(value: 0)
        cash.updatedAt = Date()
        
        let bank = FinancialAccount(context: viewContext)
        bank.id = UUID()
        bank.accountType = "Bank"
        bank.balance = NSDecimalNumber(value: 0)
        bank.updatedAt = Date()
        
        do {
            try viewContext.save()
        } catch {
            print("Failed to create default accounts: \(error)")
        }
    }
}

#Preview {
    let context = PersistenceController.preview.container.viewContext
    return AddSaleView()
        .environment(\.managedObjectContext, context)
}
