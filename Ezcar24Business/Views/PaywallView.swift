import SwiftUI
import RevenueCat

struct PaywallView: View {
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header Image
                    Image(systemName: "star.circle.fill")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 100, height: 100)
                        .foregroundColor(.yellow)
                        .padding(.top, 40)
                    
                    Text("Upgrade to Dealer Pro")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .multilineTextAlignment(.center)
                    
                    Text("Unlock the full potential of your dealership business.")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    // Features List
                    VStack(alignment: .leading, spacing: 15) {
                        FeatureRow(icon: "car.fill", text: "Unlimited Vehicles")
                        FeatureRow(icon: "icloud.fill", text: "Cloud Sync across devices")
                        FeatureRow(icon: "camera.fill", text: "Unlimited Photos")
                        FeatureRow(icon: "doc.text.fill", text: "Advanced PDF Reports")
                    }
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)
                    .padding()
                    
                    if subscriptionManager.isLoading {
                        ProgressView()
                    } else if let currentOffering = subscriptionManager.currentOffering {
                        VStack(spacing: 15) {
                            ForEach(currentOffering.availablePackages) { package in
                                Button(action: {
                                    subscriptionManager.purchase(package: package)
                                }) {
                                    HStack {
                                        VStack(alignment: .leading) {
                                            Text(package.storeProduct.subscriptionPeriod?.unit == .year ? "Yearly (Best Value)" : "Monthly")
                                                .font(.headline)
                                            Text(package.storeProduct.localizedPriceString)
                                                .font(.subheadline)
                                                .foregroundColor(.secondary)
                                        }
                                        Spacer()
                                        Text(package.storeProduct.subscriptionPeriod?.unit == .year ? "Save 20%" : "")
                                            .font(.caption)
                                            .fontWeight(.bold)
                                            .foregroundColor(.green)
                                    }
                                    .padding()
                                    .background(Color(UIColor.systemBackground))
                                    .cornerRadius(10)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .stroke(Color.blue, lineWidth: 2)
                                    )
                                }
                                .foregroundColor(.primary)
                            }
                        }
                        .padding(.horizontal)
                    } else {
                        Text("Unable to load offerings. Please check your internet connection.")
                            .foregroundColor(.red)
                            .font(.caption)
                            .onAppear {
                                subscriptionManager.fetchOfferings()
                            }
                    }
                    
                    Button("Restore Purchases") {
                        subscriptionManager.restorePurchases()
                    }
                    .font(.footnote)
                    .foregroundColor(.blue)
                    .padding(.top)
                    
                    Spacer()
                    
                    Text("Privacy Policy • Terms of Service")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .padding(.bottom)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
        .navigationViewStyle(.stack)
    }
}

struct FeatureRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 30)
            Text(text)
                .font(.body)
            Spacer()
        }
    }
}

struct PaywallView_Previews: PreviewProvider {
    static var previews: some View {
        PaywallView()
    }
}
