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
    @State private var pendingImageData: Data? = nil // Image data waiting for confirmation
    @State private var showImageConfirmation: Bool = false
    @State private var isUploadingImage: Bool = false
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
    @State private var editBuyerPhone: String = ""
    @State private var editPaymentMethod: String = "Cash"
    
    // New Feature Fields
    @State private var editAskingPrice: String = ""
    @State private var editReportURL: String = ""

    // Sharing
    @State private var showShareSheet: Bool = false
    @State private var shareItems: [Any] = []

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

    private func confirmAndUploadImage() {
        guard let data = pendingImageData, let id = vehicle.id else { return }
        isUploadingImage = true

        Task {
            // 1. Update local timestamp to trigger sync logic
            await viewContext.perform {
                vehicle.updatedAt = Date()
                try? viewContext.save()
            }

            // 2. Save image locally
            ImageStore.shared.save(imageData: data, for: id)
            refreshID = UUID()

            // 3. Sync vehicle update & upload image
            if let dealerId = CloudSyncEnvironment.currentDealerId {
                // First push the vehicle update so other clients know something changed
                await CloudSyncManager.shared?.upsertVehicle(vehicle, dealerId: dealerId)
                // Then upload the image
                await CloudSyncManager.shared?.uploadVehicleImage(vehicleId: id, dealerId: dealerId, imageData: data)
            }

            await MainActor.run {
                isUploadingImage = false
                pendingImageData = nil
                showImageConfirmation = false
            }
        }
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
                        
                        Divider()
                        
                        // New Fields
                        HStack {
                            Text("Asking Price")
                                .foregroundColor(ColorTheme.secondaryText)
                            Spacer()
                            TextField("0", text: $editAskingPrice)
                                .keyboardType(.decimalPad)
                                .onChange(of: editAskingPrice) { old, new in
                                    let filtered = filterAmountInput(new)
                                    if filtered != new { editAskingPrice = filtered }
                                }
                                .multilineTextAlignment(.trailing)
                                .frame(width: 140)
                        }
                        
                        HStack {
                            Text("Report Link")
                                .foregroundColor(ColorTheme.secondaryText)
                            Spacer()
                            TextField("https://...", text: $editReportURL)
                                .keyboardType(.URL)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled(true)
                                .multilineTextAlignment(.trailing)
                                .frame(width: 200)
                        }
                        
                        Divider()

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
                        
                        if let asking = vehicle.askingPrice?.decimalValue, asking > 0 {
                            HStack {
                                Text("Asking Price")
                                    .foregroundColor(ColorTheme.secondaryText)
                                Spacer()
                                Text(asking.asCurrency())
                                    .fontWeight(.medium)
                                    .foregroundColor(ColorTheme.primary)
                            }
                        }
                        
                        if let report = vehicle.reportURL, !report.isEmpty, let url = URL(string: report) {
                            HStack {
                                Text("Inspection Report")
                                    .foregroundColor(ColorTheme.secondaryText)
                                Spacer()
                                Link(destination: url) {
                                    HStack(spacing: 4) {
                                        Text("View Report")
                                        Image(systemName: "arrow.up.right.square")
                                    }
                                    .font(.subheadline)
                                    .foregroundColor(ColorTheme.accent)
                                }
                            }
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
                        if let ap = vehicle.askingPrice?.decimalValue { editAskingPrice = String(describing: ap) } else { editAskingPrice = "" }
                        editReportURL = vehicle.reportURL ?? ""
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
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                 Button {
                     prepareShareData()
                 } label: {
                     Image(systemName: "square.and.arrow.up")
                 }
            }
        }
        .onChange(of: selectedPhoto) { _, item in
            guard let item, let _ = vehicle.id else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self) {
                    // Store the image data for preview, don't upload yet
                    pendingImageData = data
                    showImageConfirmation = true
                }
            }
        }
        .sheet(isPresented: $showImageConfirmation) {
            ImageConfirmationSheet(
                imageData: pendingImageData,
                isUploading: $isUploadingImage,
                onConfirm: {
                    confirmAndUploadImage()
                },
                onCancel: {
                    pendingImageData = nil
                    showImageConfirmation = false
                }
            )
        }
        .sheet(isPresented: $showShareSheet) {
            ShareSheet(activityItems: shareItems)
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
            editBuyerName = vehicle.buyerName ?? ""
            editBuyerPhone = vehicle.buyerPhone ?? ""
            editPaymentMethod = vehicle.paymentMethod ?? "Cash"
            
            if let ap = vehicle.askingPrice?.decimalValue { editAskingPrice = String(describing: ap) } else { editAskingPrice = "" }
            editReportURL = vehicle.reportURL ?? ""
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
            
        let ap = sanitizedDecimal(from: editAskingPrice) ?? 0
        vehicle.askingPrice = ap > 0 ? NSDecimalNumber(decimal: ap) : nil
        vehicle.reportURL = editReportURL.isEmpty ? nil : editReportURL

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
        vehicle.updatedAt = Date()
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

    private func prepareShareData() {
        guard let id = vehicle.id else { return }
        
        let reportLink = vehicle.reportURL ?? ""
        let askingPrice = vehicle.askingPrice?.decimalValue ?? 0
        let make = vehicle.make ?? ""
        let model = vehicle.model ?? ""
        let year = vehicle.year
        let vin = vehicle.vin ?? ""
        
        // 1. Load image (async)
        ImageStore.shared.load(id: id) { loadedImage in
            // 2. Generate Image Card
            let cardView = VehicleShareCard(
                image: loadedImage,
                make: make,
                model: model,
                year: year,
                vin: vin,
                price: askingPrice,
                hasReport: !reportLink.isEmpty
            )
            
            let renderer = ImageRenderer(content: cardView)
            renderer.scale = UIScreen.main.scale
            
            var items: [Any] = []
            
            if let cardImage = renderer.uiImage {
                items.append(cardImage)
            }
            
            // 3. Add Message text with link
            var message = "Check out this \(year.asYear()) \(make) \(model)!"
            if askingPrice > 0 {
                message += " Asking: \(askingPrice.asCurrency())"
            }
            if !reportLink.isEmpty {
                message += "\n\nFull Inspection Report: \(reportLink)"
            }
            items.append(message)
            
            if let url = URL(string: reportLink) {
                items.append(url)
            }
            
            self.shareItems = items
            self.showShareSheet = true
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(
            activityItems: activityItems,
            applicationActivities: nil
        )
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

struct VehicleShareCard: View {
    let image: UIImage?
    let make: String
    let model: String
    let year: Int32
    let vin: String
    let price: Decimal
    let hasReport: Bool
    
    var body: some View {
        ZStack(alignment: .bottom) {
            Color.white
            
            VStack(spacing: 0) {
                // Image Area
                GeometryReader { geo in
                    if let image {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                            .frame(width: geo.size.width, height: geo.size.height)
                            .clipped()
                    } else {
                        ZStack {
                            Color.gray.opacity(0.1)
                            Image(systemName: "car.fill")
                                .font(.system(size: 60))
                                .foregroundColor(.gray.opacity(0.5))
                        }
                    }
                }
                .frame(height: 250)
                
                // Info Area
                VStack(alignment: .leading, spacing: 12) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(year.asYear()) \(make) \(model)")
                                .font(.system(size: 24, weight: .bold))
                                .foregroundColor(.black)
                            
                            Text("VIN: \(vin)")
                                .font(.system(size: 14))
                                .foregroundColor(.gray)
                        }
                        
                        Spacer()
                        
                        if price > 0 {
                            Text(price.asCurrency())
                                .font(.system(size: 24, weight: .heavy))
                                .foregroundColor(Color(red: 0/255, green: 122/255, blue: 255/255)) // Blue
                        }
                    }
                    
                    Divider()
                    
                    HStack {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundColor(hasReport ? .green : .gray)
                        Text(hasReport ? "Inspection Report Available" : "Verified Dealer")
                            .font(.system(size: 14, weight: .medium))
                            .foregroundColor(.black)
                        
                        Spacer()
                        
                        Text("Ezcar24")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.gray)
                    }
                }
                .padding(20)
                .background(Color.white)
            }
        }
        .frame(width: 400, height: 400)
        .cornerRadius(20)
        .shadow(radius: 10)
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
            loadImage()
        }
        .onReceive(NotificationCenter.default.publisher(for: .vehicleImageUpdated)) { notification in
            if let updatedID = notification.object as? UUID, updatedID == vehicleID {
                loadImage()
            }
        }
    }

    private func loadImage() {
        ImageStore.shared.swiftUIImage(id: vehicleID) { loaded in
            self.image = loaded
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

// MARK: - Image Confirmation Sheet
struct ImageConfirmationSheet: View {
    let imageData: Data?
    @Binding var isUploading: Bool
    let onConfirm: () -> Void
    let onCancel: () -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text("Preview Photo")
                    .font(.headline)
                    .padding(.top)

                // Image Preview
                if let data = imageData, let uiImage = UIImage(data: data) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 400)
                        .cornerRadius(12)
                        .padding(.horizontal)
                } else {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 300)
                        .overlay {
                            Image(systemName: "photo")
                                .font(.system(size: 50))
                                .foregroundColor(.gray)
                        }
                        .padding(.horizontal)
                }

                Text("Do you want to use this photo?")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Spacer()

                // Action Buttons
                VStack(spacing: 12) {
                    Button(action: onConfirm) {
                        HStack {
                            if isUploading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            }
                            Text(isUploading ? "Uploading..." : "Confirm")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(ColorTheme.primary)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isUploading)

                    Button(action: onCancel) {
                        Text("Cancel")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.gray.opacity(0.15))
                            .foregroundColor(.primary)
                            .cornerRadius(12)
                    }
                    .disabled(isUploading)
                }
                .padding(.horizontal)
                .padding(.bottom, 30)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        onCancel()
                    }
                    .disabled(isUploading)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        onConfirm()
                    } label: {
                        if isUploading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle())
                        } else {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.title2)
                                .foregroundColor(ColorTheme.primary)
                        }
                    }
                    .disabled(isUploading)
                }
            }
        }
        .interactiveDismissDisabled(isUploading)
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
