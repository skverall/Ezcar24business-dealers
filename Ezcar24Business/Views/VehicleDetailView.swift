//
//  VehicleDetailView.swift
//  Ezcar24Business
//
//  Detailed view of a single vehicle with expenses
//

import SwiftUI

import PhotosUI

struct VehicleDetailView: View {
    @Environment(\.managedObjectContext) private var viewContext
    let vehicle: Vehicle
    @State private var selectedPhoto: PhotosPickerItem? = nil
    @State private var refreshID = UUID()
    @State private var editStatus: String = ""
    @State private var editPurchasePrice: String = ""
    @State private var editSalePrice: String = ""
    @State private var editSaleDate: Date = Date()
    @State private var isSaving: Bool = false
    @State private var showSavedToast: Bool = false
    @State private var saveError: String? = nil

    // Editable fields
    @State private var editVIN: String = ""
    @State private var editMake: String = ""
    @State private var editModel: String = ""
    @State private var editYear: String = ""
    @State private var editPurchaseDate: Date = Date()
    @State private var editNotes: String = ""
    @State private var editBuyerName: String = ""
    @State private var editBuyerPhone: String = ""
    @State private var editPaymentMethod: String = "Cash"
    
    let paymentMethods = ["Cash", "Bank Transfer", "Cheque", "Finance", "Other"]

    @State private var isEditing: Bool = false

    @State private var showAdvancedEditor: Bool = false

    private func filterAmountInput(_ s: String) -> String {
        var result = ""
        var hasDot = false
        var decimals = 0
        for ch in s.replacingOccurrences(of: ",", with: ".") {
            if ch >= "0" && ch <= "9" {
                if hasDot { if decimals < 2 { result.append(ch); decimals += 1 } }
                else { result.append(ch) }
            } else if ch == "." && !hasDot {
                hasDot = true
                result.append(ch)
            }
        }
        return result
    }

    private func sanitizedDecimal(from s: String) -> Decimal? {
        let filtered = filterAmountInput(s)
        return Decimal(string: filtered)
    }




    @FetchRequest var expenses: FetchedResults<Expense>

    init(vehicle: Vehicle) {
        self.vehicle = vehicle
        _expenses = FetchRequest(
            sortDescriptors: [NSSortDescriptor(keyPath: \Expense.date, ascending: false)],
            predicate: NSPredicate(format: "vehicle == %@", vehicle),
            animation: .default
        )
    }

    var totalExpenses: Decimal {
        expenses.reduce(0) { $0 + ($1.amount?.decimalValue ?? 0) }
    }

    var profit: Decimal? {
        guard let sale = vehicle.salePrice?.decimalValue else { return nil }
        let buy = vehicle.purchasePrice?.decimalValue ?? 0
        return sale - (buy + totalExpenses)
    }

    var totalCost: Decimal {
        (vehicle.purchasePrice?.decimalValue ?? 0) + totalExpenses
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Vehicle Photo
                if let id = vehicle.id {
                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        VehicleLargeImageView(vehicleID: id)
                            .id(refreshID)
                            .padding(.horizontal)
                    }
                }

                // Vehicle Header
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(vehicle.make ?? "") \(vehicle.model ?? "")")
                                .font(.title2)
                                .fontWeight(.bold)

                            Text("Year: \(vehicle.year.asYear())")
                                .font(.subheadline)
                                .foregroundColor(ColorTheme.secondaryText)
                        }

                        Spacer()

                        StatusBadge(status: vehicle.status ?? "")
                    }

                    Divider()

                    VStack(alignment: .leading, spacing: 8) {
                        if isEditing {
                            HStack {
                                Text("VIN")
                                    .foregroundColor(ColorTheme.secondaryText)
                                Spacer()
                                TextField("VIN", text: $editVIN)
                                    .textInputAutocapitalization(.characters)
                                    .multilineTextAlignment(.trailing)
                                    .frame(width: 200)
                            }
                            .font(.subheadline)
                        } else {
                            HStack {
                                Text("VIN:")
                                    .foregroundColor(ColorTheme.secondaryText)
                                Text(vehicle.vin ?? "")
                                    .fontWeight(.medium)
                            }
                            .font(.subheadline)
                        }

                        if isEditing {
                            DatePicker("Purchase Date", selection: $editPurchaseDate, displayedComponents: .date)
                                .font(.subheadline)
                        } else {
                            HStack {
                                Text("Purchase Date:")
                                    .foregroundColor(ColorTheme.secondaryText)
                                Text(vehicle.purchaseDate ?? Date(), style: .date)
                                    .fontWeight(.medium)
                            }
                            .font(.subheadline)
                        }
                    }

                    if isEditing {
                        Divider()
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Notes")
                                .font(.caption)
                                .foregroundColor(ColorTheme.secondaryText)
                            TextEditor(text: $editNotes)
                                .frame(minHeight: 90)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.gray.opacity(0.2))
                                )
                        }
                    } else if let notes = vehicle.notes, !notes.isEmpty {
                        Divider()
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Notes")
                                .font(.caption)
                                .foregroundColor(ColorTheme.secondaryText)
                            Text(notes)
                                .font(.subheadline)
                        }
                    }
                }
                .padding()
                .textFieldStyle(.roundedBorder)
                .cardStyle()
                .padding(.horizontal)
                // Edit mode banner
                if isEditing {
                    HStack(spacing: 8) {
                        Image(systemName: "pencil.and.outline").foregroundColor(ColorTheme.accent)
                        Text("Editing mode — Done will save, Cancel will discard changes")
                            .font(.footnote)
                            .foregroundColor(ColorTheme.secondaryText)
                    }
                    .padding(10)
                    .background(.ultraThinMaterial)
                    .cornerRadius(10)
                    .padding(.horizontal)
                }


                // Vehicle Info (Editable)
                if isEditing && showAdvancedEditor {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Vehicle Info")
                        .font(.headline)
                        .padding(.horizontal)

                    VStack(spacing: 12) {
                        HStack {
                            Text("VIN")
                                .foregroundColor(ColorTheme.secondaryText)
                            Spacer()
                            TextField("VIN", text: $editVIN)
                                .textInputAutocapitalization(.characters)
                                .multilineTextAlignment(.trailing)
                                .frame(width: 200)
                        }
                        HStack {
                            Text("Make")
                                .foregroundColor(ColorTheme.secondaryText)
                            Spacer()
                            TextField("Make", text: $editMake)
                                .multilineTextAlignment(.trailing)
                                .frame(width: 200)
                        }
                        HStack {
                            Text("Model")
                                .foregroundColor(ColorTheme.secondaryText)
                            Spacer()
                            TextField("Model", text: $editModel)
                                .multilineTextAlignment(.trailing)
                                .frame(width: 200)
                        }
                        HStack {
                            Text("Year")
                                .foregroundColor(ColorTheme.secondaryText)
                            Spacer()
                            TextField("Year", text: $editYear)
                                .keyboardType(.numberPad)
                                .multilineTextAlignment(.trailing)
                                .frame(width: 100)
                        }
                        DatePicker("Purchase Date", selection: $editPurchaseDate, displayedComponents: .date)

                        VStack(alignment: .leading, spacing: 6) {
                            Text("Notes")
                                .foregroundColor(ColorTheme.secondaryText)
                            TextEditor(text: $editNotes)
                                .frame(minHeight: 90)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.gray.opacity(0.2))
                                )
                        }
                    }
                    .padding(.horizontal)
                }
                .textFieldStyle(.roundedBorder)
                .padding()
                .cardStyle()
                .padding(.horizontal)
                }

                // Status & Sale
                if isEditing {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Status & Sale")
                        .font(.headline)
                        .padding(.horizontal)

                    VStack(spacing: 12) {
                        // Status
                        HStack {
                            Text("Status")
                                .foregroundColor(ColorTheme.secondaryText)
                            Spacer()
                            Picker("Status", selection: $editStatus) {
                                Text("Owned").tag("owned")
                                Text("On Sale").tag("on_sale")
                                Text("In Transit").tag("in_transit")
                                Text("Under Service").tag("under_service")
                                Text("Sold").tag("sold")
                            }
                            .pickerStyle(.menu)
                        }

                        // Purchase Price
                        HStack {
                            Text("Purchase Price")
                                .foregroundColor(ColorTheme.secondaryText)
                            Spacer()
                            TextField("0", text: $editPurchasePrice)
                                .keyboardType(.decimalPad)
                                .onChange(of: editPurchasePrice) { old, new in
                                    let filtered = filterAmountInput(new)
                                    if filtered != new { editPurchasePrice = filtered }
                                }
                                .multilineTextAlignment(.trailing)
                                .frame(width: 140)
                        }

                        if editStatus == "sold" {


                            HStack {
                                Text("Sale Price")
                                    .foregroundColor(ColorTheme.secondaryText)
                                Spacer()
                                TextField("0", text: $editSalePrice)
                                    .keyboardType(.decimalPad)
                                    .onChange(of: editSalePrice) { old, new in
                                        let filtered = filterAmountInput(new)
                                        if filtered != new { editSalePrice = filtered }
                                    }
                                    .multilineTextAlignment(.trailing)
                                    .frame(width: 140)
                            }
                            DatePicker("Sale Date", selection: $editSaleDate, displayedComponents: .date)
                            
                            Divider()
                            
                            Text("Buyer Details")
                                .font(.caption)
                                .foregroundColor(ColorTheme.secondaryText)
                            
                            TextField("Buyer Name", text: $editBuyerName)
                            TextField("Buyer Phone", text: $editBuyerPhone)
                                .keyboardType(.phonePad)
                            
                            Picker("Payment Method", selection: $editPaymentMethod) {
                                ForEach(paymentMethods, id: \.self) { method in
                                    Text(method).tag(method)
                                }
                            }
                        }

                        Button(action: saveVehicleDetails) {
                            if isSaving {
                                ProgressView()
                                    .frame(maxWidth: .infinity)
                            } else {
                                Text("Save Changes")
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .disabled(isSaving || (editStatus == "sold" && sanitizedDecimal(from: editSalePrice) == nil))
                        .buttonStyle(.borderedProminent)
                    }
                    .padding(.horizontal)
                }
                .textFieldStyle(.roundedBorder)
                .padding()
                .cardStyle()
                .padding(.horizontal)
                }

                // Financial Summary
                VStack(alignment: .leading, spacing: 12) {
                    Text("Financial Summary")
                        .font(.headline)
                        .padding(.horizontal)

                    VStack(spacing: 12) {
                        HStack {
                            Text("Purchase Price")
                                .foregroundColor(ColorTheme.secondaryText)
                            Spacer()
                            Text((vehicle.purchasePrice?.decimalValue ?? 0).asCurrency())
                                .fontWeight(.medium)
                        }

                        HStack {
                            Text("Total Expenses")
                                .foregroundColor(ColorTheme.secondaryText)
                            Spacer()
                            Text(totalExpenses.asCurrency())
                                .fontWeight(.medium)
                                .foregroundColor(ColorTheme.accent)
                        }

                        Divider()

                        HStack {
                            Text("Total Cost")
                                .font(.headline)
                            Spacer()
                            Text(totalCost.asCurrency())
                                .font(.headline)
                                .foregroundColor(ColorTheme.primary)
                        }

                        if let sale = vehicle.salePrice?.decimalValue {
                            HStack {
                                Text("Sale Price")
                                    .foregroundColor(ColorTheme.secondaryText)
                                Spacer()
                                Text(sale.asCurrency())
                                    .fontWeight(.medium)
                                    .foregroundColor(ColorTheme.success)
                            }
                            if let d = vehicle.saleDate {
                                HStack {
                                    Text("Sale Date")
                                        .foregroundColor(ColorTheme.secondaryText)
                                    Spacer()
                                    Text(d.formatted(date: .abbreviated, time: .omitted))
                                        .fontWeight(.medium)
                                }
                            }

                            Divider()

                            if let p = profit {
                                HStack {
                                    Text("Profit/Loss")
                                        .font(.headline)
                                    Spacer()
                                    Text(p.asCurrency())
                                        .font(.headline)
                                        .foregroundColor(p >= 0 ? ColorTheme.success : ColorTheme.danger)
                                }
                            }
                        }
                        
                        if let buyer = vehicle.buyerName, !buyer.isEmpty {
                            Divider()
                            HStack {
                                Text("Buyer")
                                    .foregroundColor(ColorTheme.secondaryText)
                                Spacer()
                                Text(buyer)
                                    .fontWeight(.medium)
                            }
                            if let phone = vehicle.buyerPhone, !phone.isEmpty {
                                HStack {
                                    Text("Phone")
                                        .foregroundColor(ColorTheme.secondaryText)
                                    Spacer()
                                    Text(phone)
                                        .fontWeight(.medium)
                                }
                            }
                            if let method = vehicle.paymentMethod, !method.isEmpty {
                                HStack {
                                    Text("Payment")
                                        .foregroundColor(ColorTheme.secondaryText)
                                    Spacer()
                                    Text(method)
                                        .fontWeight(.medium)
                                }
                            }
                        }
                    }

                    .padding()
                    .cardStyle()
                    .padding(.horizontal)
                }

                // Expenses List
                VStack(alignment: .leading, spacing: 12) {
                    Text("Expenses (\(expenses.count))")
                        .font(.headline)
                        .padding(.horizontal)

                    if expenses.isEmpty {
                        Text("No expenses recorded for this vehicle")
                            .foregroundColor(ColorTheme.secondaryText)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .cardStyle()
                            .padding(.horizontal)
                    } else {
                        VStack(spacing: 12) {
                            ForEach(expenses, id: \.id) { expense in
                                VehicleExpenseRow(expense: expense)
                            }
                        }
                        .padding()
                        .cardStyle()
                        .padding(.horizontal)
                    }
                }
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                if isEditing {
                    Button("Cancel") {
                        // discard edits and exit edit mode
                        editStatus = vehicle.status ?? "owned"
                        if let pp = vehicle.purchasePrice?.decimalValue { editPurchasePrice = String(describing: pp) } else { editPurchasePrice = "" }
                        if let sp = vehicle.salePrice?.decimalValue { editSalePrice = String(describing: sp) } else { editSalePrice = "" }
                        if let sd = vehicle.saleDate { editSaleDate = sd }
                        editVIN = vehicle.vin ?? ""
                        editMake = vehicle.make ?? ""
                        editModel = vehicle.model ?? ""
                        editYear = vehicle.year == 0 ? "" : String(vehicle.year)
                        editPurchaseDate = vehicle.purchaseDate ?? Date()
                        editNotes = vehicle.notes ?? ""
                        editBuyerName = vehicle.buyerName ?? ""
                        editBuyerPhone = vehicle.buyerPhone ?? ""
                        editPaymentMethod = vehicle.paymentMethod ?? "Cash"
                        isEditing = false
                    }
                }
            }

            ToolbarItem(placement: .navigationBarTrailing) {
                Button(isEditing ? "Done" : "Edit") {
                    if isEditing {
                        saveVehicleDetails()
                        isEditing = false
                    } else {
                        // populate fields from current vehicle
                        editVIN = vehicle.vin ?? ""
                        editMake = vehicle.make ?? ""
                        editModel = vehicle.model ?? ""
                        editYear = vehicle.year == 0 ? "" : String(vehicle.year)
                        editPurchaseDate = vehicle.purchaseDate ?? Date()
                        editNotes = vehicle.notes ?? ""
                        editBuyerName = vehicle.buyerName ?? ""
                        editBuyerPhone = vehicle.buyerPhone ?? ""
                        editPaymentMethod = vehicle.paymentMethod ?? "Cash"
                        isEditing = true
                    }
                }
            }
            ToolbarItem(placement: .navigationBarTrailing) {

                Menu {
                    PhotosPicker(selection: $selectedPhoto, matching: .images) {

                        Label("Edit Photo", systemImage: "photo.on.rectangle")
                    }
                    if let id = vehicle.id, ImageStore.shared.hasImage(id: id) {
                        Button(role: .destructive) {
                            ImageStore.shared.delete(id: id) {
                                refreshID = UUID()
                            }
                        } label: {
                            Label("Delete Photo", systemImage: "trash")
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .onChange(of: selectedPhoto) { _, item in
            guard let item, let id = vehicle.id else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self) {
                    ImageStore.shared.save(imageData: data, for: id)
                    refreshID = UUID()
                    if let dealerId = CloudSyncEnvironment.currentDealerId {
                        await CloudSyncManager.shared?.uploadVehicleImage(vehicleId: id, dealerId: dealerId, imageData: data)
                    }
                }
            }
        }

            }
            .padding(.vertical)
        }
        .onAppear {
            // Initialize edit fields
            editStatus = vehicle.status ?? "owned"
            if let pp = vehicle.purchasePrice?.decimalValue { editPurchasePrice = String(describing: pp) } else { editPurchasePrice = "" }
            if let sp = vehicle.salePrice?.decimalValue { editSalePrice = String(describing: sp) }
            if let sd = vehicle.saleDate { editSaleDate = sd }

            // Basic info
            editVIN = vehicle.vin ?? ""
            editMake = vehicle.make ?? ""
            editModel = vehicle.model ?? ""
            editYear = vehicle.year == 0 ? "" : String(vehicle.year)
            editPurchaseDate = vehicle.purchaseDate ?? Date()
            editNotes = vehicle.notes ?? ""
            editBuyerName = vehicle.buyerName ?? ""
            editBuyerPhone = vehicle.buyerPhone ?? ""
            editPaymentMethod = vehicle.paymentMethod ?? "Cash"
        }
        .background(ColorTheme.secondaryBackground)
        .navigationTitle("Vehicle Details")
        .navigationBarTitleDisplayMode(.inline)
        .overlay(alignment: .top) {
            VStack {
                if isSaving {
                    Label("Saving...", systemImage: "arrow.triangle.2.circlepath")
                        .padding(10)
                        .background(.ultraThinMaterial)
                        .cornerRadius(10)
                        .transition(.opacity)
                } else if showSavedToast {
                    Label("Saved", systemImage: "checkmark.circle.fill")
                        .foregroundColor(ColorTheme.success)
                        .padding(10)
                        .background(.ultraThinMaterial)
                        .cornerRadius(10)
                        .transition(.move(edge: .top).combined(with: .opacity))
                } else if let err = saveError {
                    Label(err, systemImage: "exclamationmark.triangle")
                        .foregroundColor(ColorTheme.danger)
                        .padding(10)
                        .background(.ultraThinMaterial)
                        .cornerRadius(10)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
            .padding(.top, 8)
        }
    }

    private func saveVehicleDetails() {
        guard !isSaving else { return }
        withAnimation { saveError = nil; showSavedToast = false; isSaving = true }

        // Haptics
        #if os(iOS)
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        #endif

        // Basic info from edit fields
        vehicle.vin = editVIN
        vehicle.make = editMake
        vehicle.model = editModel
        if let y = Int32(editYear) { vehicle.year = y }
        vehicle.purchaseDate = editPurchaseDate
        let trimmedNotes = editNotes.trimmingCharacters(in: .whitespacesAndNewlines)
        vehicle.notes = trimmedNotes.isEmpty ? nil : trimmedNotes

        // Prices & status
        let pp = sanitizedDecimal(from: editPurchasePrice) ?? 0
        vehicle.purchasePrice = NSDecimalNumber(decimal: pp)
        vehicle.status = editStatus
        if editStatus == "sold" {
            if let sp = sanitizedDecimal(from: editSalePrice) {
                vehicle.salePrice = NSDecimalNumber(decimal: sp)
            } else {
                vehicle.salePrice = nil
            }
            vehicle.saleDate = editSaleDate
            vehicle.buyerName = editBuyerName
            vehicle.buyerPhone = editBuyerPhone
            vehicle.paymentMethod = editPaymentMethod
        } else {
            vehicle.salePrice = nil
            vehicle.saleDate = nil
            vehicle.buyerName = nil
            vehicle.buyerPhone = nil
            vehicle.paymentMethod = nil
        }
        do {
            try viewContext.save()
            #if os(iOS)
            generator.notificationOccurred(.success)
            #endif
            withAnimation {
                isSaving = false
                showSavedToast = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                withAnimation { showSavedToast = false }
            }
        } catch {
            #if os(iOS)
            generator.notificationOccurred(.error)
            #endif
            withAnimation {
                isSaving = false
                saveError = "Save failed"
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
                withAnimation { saveError = nil }
            }
            print("Failed to save sale details: \(error)")
        }
    }

}



struct VehicleLargeImageView: View {
    let vehicleID: UUID
    @State private var image: Image? = nil

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.gray.opacity(0.12))
                .frame(height: 180)
            if let image {
                image
                    .resizable()
                    .scaledToFill()
                    .frame(height: 180)
                    .clipped()
                    .cornerRadius(12)
            } else {
                Image(systemName: "car.fill")
                    .font(.system(size: 42))
                    .foregroundColor(ColorTheme.secondaryText)
            }
        }
        .onAppear {
            ImageStore.shared.swiftUIImage(id: vehicleID) { loaded in
                self.image = loaded
            }
        }
    }
}

struct VehicleExpenseRow: View {
    let expense: Expense

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(expense.expenseDescription ?? "No description")
                    .font(.subheadline)
                    .fontWeight(.medium)

                Spacer()

                Text((expense.amount as Decimal? ?? 0).asCurrency())
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(ColorTheme.primary)
            }

            HStack {
                Text(expense.date ?? Date(), style: .date)
                    .font(.caption)
                    .foregroundColor(ColorTheme.secondaryText)

                if let user = expense.user {
                    Spacer()
                    Label(user.name ?? "", systemImage: "person.fill")
                        .font(.caption)
                        .foregroundColor(ColorTheme.secondaryText)
                }
            }

            if expense != expense {
                Divider()
            }
        }
    }
}

#Preview {
    let context = PersistenceController.preview.container.viewContext
    let vehicle = Vehicle(context: context)
    vehicle.id = UUID()
    vehicle.vin = "1HGBH41JXMN109186"
    vehicle.make = "Toyota"
    vehicle.model = "Land Cruiser"
    vehicle.year = 2022
    vehicle.purchasePrice = NSDecimalNumber(value: 185000.0)
    vehicle.purchaseDate = Date()
    vehicle.status = "owned"
    vehicle.createdAt = Date()

    return NavigationStack {
        VehicleDetailView(vehicle: vehicle)
            .environment(\.managedObjectContext, context)
    }
}
