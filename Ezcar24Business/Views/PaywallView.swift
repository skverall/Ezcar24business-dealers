import SwiftUI
import RevenueCat

struct PaywallView: View {
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @EnvironmentObject private var sessionStore: SessionStore
    @EnvironmentObject private var appSessionState: AppSessionState

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 10) {
                    // Header Image
                    Image(systemName: "star.circle.fill")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 80, height: 80)
                        .foregroundColor(.yellow)
                        .padding(.top, 10)
                    
                    Text("Upgrade to Dealer Pro")
                        .font(.title)
                        .fontWeight(.bold)
                        .multilineTextAlignment(.center)
                    
                    Text("Unlock the full potential of your dealership business.")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                    
                    // Features List
                    VStack(alignment: .leading, spacing: 10) {
                        FeatureRow(icon: "car.fill", text: "Unlimited Vehicles")
                        FeatureRow(icon: "icloud.fill", text: "Cloud Sync across devices")
                        FeatureRow(icon: "camera.fill", text: "Unlimited Photos")
                        FeatureRow(icon: "doc.text.fill", text: "Advanced PDF Reports")
                    }
                    .padding(12)
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
                    if subscriptionManager.isLoading {
                        ProgressView()
                            .scaleEffect(1.5)
                            .padding()
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
                        VStack(spacing: 12) {
                            if let error = subscriptionManager.errorMessage {
                                Text(error)
                                    .foregroundColor(.red)
                                    .font(.caption)
                                    .multilineTextAlignment(.center)
                            }
                            Text("Unable to load offerings.")
                                .foregroundColor(.secondary)
                            Button("Retry") {
                                subscriptionManager.fetchOfferings()
                            }
                            .buttonStyle(.bordered)
                        }
                        .padding()
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
                    
                    // Debug Info
                    if let info = subscriptionManager.customerInfo {
                        Text("Debug: Active Entitlements: \(info.entitlements.active.keys.joined(separator: ", "))")
                            .font(.caption2)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Sign Out") {
                        Task {
                            await sessionStore.signOut()
                            await MainActor.run {
                                appSessionState.mode = .signIn
                            }
                        }
                    }
                }
            }
            .onAppear {
                if subscriptionManager.currentOffering == nil {
                    subscriptionManager.fetchOfferings()
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
