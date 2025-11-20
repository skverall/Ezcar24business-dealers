//
//  AddVehicleView.swift
//  Ezcar24Business
//
//  Form for adding new vehicles
//

import SwiftUI
import PhotosUI

struct AddVehicleView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: VehicleViewModel
    
    @State private var vin = ""
    @State private var make = ""
    @State private var model = ""
    @State private var year = ""
    @State private var purchasePrice = ""
    @State private var purchaseDate = Date()
    @State private var status = "owned"
    @State private var notes = ""
    @State private var salePrice = ""
    @State private var saleDate = Date()

    // Photo picking
    @State private var selectedPhoto: PhotosPickerItem? = nil
    @State private var selectedImageData: Data? = nil
    @State private var selectedImage: Image? = nil
    @State private var isCompressing = false

    let statusOptions = [
        ("owned", "Reserved"),
        ("on_sale", "On Sale"),
        ("in_transit", "In Transit"),
        ("under_service", "Under Service"),
        ("sold", "Sold")
    ]

    var isFormValid: Bool {
        let baseValid = !vin.isEmpty && !make.isEmpty && !model.isEmpty && !year.isEmpty && !purchasePrice.isEmpty
        if status == "sold" { return baseValid && !salePrice.isEmpty }
        return baseValid
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Photo Section (Prominent at top)
                    photoSection
                    
                    VStack(spacing: 20) {
                        // Basic Info
                        GroupBox(label: Label("Vehicle Details", systemImage: "car.fill")) {
                            VStack(spacing: 12) {
                                CustomTextField(title: "VIN", text: $vin, icon: "number")
                                    .textInputAutocapitalization(.characters)
                                
                                HStack(spacing: 12) {
                                    CustomTextField(title: "Make", placeholder: "Toyota", text: $make, icon: "tag")
                                    CustomTextField(title: "Model", placeholder: "Camry", text: $model, icon: "tag.fill")
                                }
                                
                                CustomTextField(title: "Year", text: $year, icon: "calendar")
                                    .keyboardType(.numberPad)
                            }
                            .padding(.vertical, 8)
                        }
                        
                        // Financials
                        GroupBox(label: Label("Purchase & Status", systemImage: "dollarsign.circle.fill")) {
                            VStack(spacing: 12) {
                                CustomTextField(title: "Purchase Price (AED)", text: $purchasePrice, icon: "banknote")
                                    .keyboardType(.decimalPad)
                                
                                DatePicker("Purchase Date", selection: $purchaseDate, displayedComponents: .date)
                                    .padding(.vertical, 4)
                                
                                Divider()
                                
                                Picker("Status", selection: $status) {
                                    ForEach(statusOptions, id: \.0) { option in
                                        Text(option.1).tag(option.0)
                                    }
                                }
                                .pickerStyle(.menu)
                                .padding(.vertical, 4)
                            }
                            .padding(.vertical, 8)
                        }
                        
                        if status == "sold" {
                            GroupBox(label: Label("Sale Details", systemImage: "checkmark.circle.fill")) {
                                VStack(spacing: 12) {
                                    CustomTextField(title: "Sale Price (AED)", text: $salePrice, icon: "banknote.fill")
                                        .keyboardType(.decimalPad)
                                    DatePicker("Sale Date", selection: $saleDate, displayedComponents: .date)
                                }
                                .padding(.vertical, 8)
                            }
                        }
                        
                        GroupBox(label: Label("Notes", systemImage: "note.text")) {
                            TextEditor(text: $notes)
                                .frame(minHeight: 80)
                                .padding(4)
                                .background(Color.gray.opacity(0.1))
                                .cornerRadius(8)
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .background(ColorTheme.secondaryBackground)
            .navigationTitle("Add Vehicle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { saveVehicle() }
                        .disabled(!isFormValid || isCompressing)
                        .fontWeight(.semibold)
                }
            }
        }
    }
    
    var photoSection: some View {
        VStack {
            ZStack {
                if let image = selectedImage {
                    image
                        .resizable()
                        .scaledToFill()
                        .frame(width: 120, height: 120)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(ColorTheme.primary.opacity(0.3), lineWidth: 1)
                        )
                } else {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(ColorTheme.background)
                        .frame(width: 120, height: 120)
                        .overlay(
                            VStack(spacing: 8) {
                                Image(systemName: "camera.fill")
                                    .font(.system(size: 30))
                                    .foregroundColor(ColorTheme.primary)
                                Text("Add Photo")
                                    .font(.caption)
                                    .foregroundColor(ColorTheme.secondaryText)
                            }
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(style: StrokeStyle(lineWidth: 1, dash: [5]))
                                .foregroundColor(ColorTheme.primary.opacity(0.5))
                        )
                }
                
                if isCompressing {
                    ProgressView()
                        .padding()
                        .background(.ultraThinMaterial)
                        .cornerRadius(8)
                }
            }
            .onTapGesture {
                // This is just visual, the picker is below or overlay
            }
            .overlay(
                PhotosPicker(selection: $selectedPhoto, matching: .images, photoLibrary: .shared()) {
                    Color.clear
                }
                .onChange(of: selectedPhoto) { _, newValue in
                    loadAndCompressImage(from: newValue)
                }
            )
        }
    }
    
    private func saveVehicle() {
        guard let yearInt = Int32(year),
              let priceDecimal = Decimal(string: purchasePrice) else {
            return
        }

        let salePriceDecimal: Decimal? = (status == "sold") ? Decimal(string: salePrice) : nil

        let vehicle = viewModel.addVehicle(
            vin: vin,
            make: make,
            model: model,
            year: yearInt,
            purchasePrice: priceDecimal,
            purchaseDate: purchaseDate,
            status: status,
            notes: notes,
            imageData: selectedImageData,
            salePrice: salePriceDecimal,
            saleDate: (status == "sold") ? saleDate : nil
        )

        if let dealerId = CloudSyncEnvironment.currentDealerId {
            Task {
                await CloudSyncManager.shared?.upsertVehicle(vehicle, dealerId: dealerId)
                if let imageData = selectedImageData, let id = vehicle.id {
                    await CloudSyncManager.shared?.uploadVehicleImage(vehicleId: id, dealerId: dealerId, imageData: imageData)
                }
            }
        }

        dismiss()
    }
}

// Helper View for TextFields
struct CustomTextField: View {
    let title: String
    var placeholder: String = ""
    @Binding var text: String
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(ColorTheme.secondaryText)
            
            HStack {
                Image(systemName: icon)
                    .foregroundColor(ColorTheme.primary.opacity(0.6))
                    .frame(width: 20)
                
                TextField(placeholder.isEmpty ? title : placeholder, text: $text)
            }
            .padding(10)
            .background(ColorTheme.background)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
            )
        }
    }
}

extension AddVehicleView {
    // Logic to load and compress image
    func loadAndCompressImage(from item: PhotosPickerItem?) {
        guard let item else { return }
        isCompressing = true
        
        Task {
            if let data = try? await item.loadTransferable(type: Data.self),
               let uiImage = UIImage(data: data) {
                
                // Compress
                let compressedData = uiImage.compressed()
                
                await MainActor.run {
                    self.selectedImageData = compressedData
                    if let compressedData, let compressedImage = UIImage(data: compressedData) {
                        self.selectedImage = Image(uiImage: compressedImage)
                        print("Original size: \(data.count) bytes, Compressed: \(compressedData.count) bytes")
                    } else {
                        // Fallback if compression fails
                        self.selectedImage = Image(uiImage: uiImage)
                        self.selectedImageData = data
                    }
                    self.isCompressing = false
                }
            } else {
                await MainActor.run {
                    isCompressing = false
                }
            }
        }
    }
}

#Preview {
    let context = PersistenceController.preview.container.viewContext
    let viewModel = VehicleViewModel(context: context)
    
    return AddVehicleView(viewModel: viewModel)
}


extension UIImage {
    /// Resizes the image to fit within the maxDimension and compresses it to the specified quality.
    /// Returns the JPEG data.
    func compressed(maxDimension: CGFloat = 1024, compressionQuality: CGFloat = 0.7) -> Data? {
        var actualHeight = self.size.height
        var actualWidth = self.size.width
        let maxHeight: CGFloat = maxDimension
        let maxWidth: CGFloat = maxDimension
        var imgRatio = actualWidth / actualHeight
        let maxRatio = maxWidth / maxHeight
        
        // Resize logic
        if actualHeight > maxHeight || actualWidth > maxWidth {
            if imgRatio < maxRatio {
                // Adjust width according to maxHeight
                imgRatio = maxHeight / actualHeight
                actualWidth = imgRatio * actualWidth
                actualHeight = maxHeight
            } else if imgRatio > maxRatio {
                // Adjust height according to maxWidth
                imgRatio = maxWidth / actualWidth
                actualHeight = imgRatio * actualHeight
                actualWidth = maxWidth
            } else {
                actualHeight = maxHeight
                actualWidth = maxWidth
            }
        }
        
        let rect = CGRect(x: 0.0, y: 0.0, width: actualWidth, height: actualHeight)
        UIGraphicsBeginImageContext(rect.size)
        self.draw(in: rect)
        let img = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        guard let resizedImage = img else { return nil }
        
        // Compress
        return resizedImage.jpegData(compressionQuality: compressionQuality)
    }
}

