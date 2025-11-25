import SwiftUI
import RevenueCat

struct PaywallView: View {
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @EnvironmentObject private var sessionStore: SessionStore
    @EnvironmentObject private var appSessionState: AppSessionState
    @EnvironmentObject private var cloudSyncManager: CloudSyncManager
    @Environment(\.dismiss) private var dismiss

    private var isSignedIn: Bool {
        if case .signedIn = sessionStore.status { return true }
        return false
    }

    private var isGuest: Bool {
        appSessionState.isGuestMode && !isSignedIn
    }

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
                    
                    if isSignedIn {
                        SubscriptionStateView(subscriptionManager: subscriptionManager)
                        
                        Button(action: { subscriptionManager.restorePurchases() }) {
                            HStack(spacing: 8) {
                                if subscriptionManager.isRestoring {
                                    ProgressView()
                                        .progressViewStyle(.circular)
                                }
                                Text(subscriptionManager.isRestoring ? "Restoring..." : "Restore Purchases")
                            }
                        }
                        .font(.footnote)
                        .foregroundColor(.blue)
                        .padding(.top)
                        .disabled(subscriptionManager.isRestoring)
                    } else {
                        guestGate
                    }
                    
                    Spacer()
                    
                    Text("Privacy Policy • Terms of Service")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .padding(.bottom)
                    
                    // Debug Info
                    if isSignedIn, let info = subscriptionManager.customerInfo {
                        Text("Debug: Active Entitlements: \(info.entitlements.active.keys.joined(separator: ", "))")
                            .font(.caption2)
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    if isSignedIn {
                        Button("Sign Out") {
                            Task {
                                // Process offline queue before sign out
                                if case .signedIn(let user) = sessionStore.status {
                                    await cloudSyncManager.processOfflineQueue(dealerId: user.id)
                                }
                                await sessionStore.signOut()
                                await MainActor.run {
                                    appSessionState.mode = .signIn
                                }
                            }
                        }
                    } else {
                        Button("Close") { dismiss() }
                    }
                }
            }
            .onAppear {
                if isSignedIn && subscriptionManager.currentOffering == nil {
                    subscriptionManager.fetchOfferings()
                }
            }
            .onChange(of: sessionStore.status) { _, newStatus in
                if case .signedIn = newStatus {
                    subscriptionManager.fetchOfferings()
                }
            }
            .alert("Restore Purchases", isPresented: Binding<Bool>(
                get: { subscriptionManager.restoreStatus != .idle },
                set: { if !$0 { subscriptionManager.restoreStatus = .idle } }
            )) {
                Button("OK") {
                    subscriptionManager.restoreStatus = .idle
                }
            } message: {
                switch subscriptionManager.restoreStatus {
                case .success:
                    Text("Your purchases were restored successfully!")
                case .error(let message):
                    Text("Error restoring purchases: \(message)")
                case .noPurchases:
                    Text("No active subscriptions were found to restore.")
                case .idle:
                    EmptyView()
                }
            }
        }
        .navigationViewStyle(.stack)
    }

    @ViewBuilder
    private var guestGate: some View {
        VStack(spacing: 14) {
            Image(systemName: "person.crop.circle.badge.questionmark")
                .font(.system(size: 46))
                .foregroundColor(.orange)

            Text("Sign in to upgrade")
                .font(.headline)

            Text("Subscriptions are tied to an account. Sign in or create one to continue.")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button {
                appSessionState.exitGuestModeForLogin()
                dismiss()
            } label: {
                Text("Go to Login")
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
            }
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(12)
            .padding(.horizontal)

            if isGuest {
                Text("You are currently browsing offline as a guest.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }
}

struct SubscriptionStateView: View {
    @ObservedObject var subscriptionManager: SubscriptionManager
    
    var body: some View {
        if subscriptionManager.isLoading {
            ProgressView()
                .scaleEffect(1.5)
                .padding()
        } else if subscriptionManager.isProAccessActive {
            VStack(spacing: 16) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 60))
                    .foregroundColor(.green)
                
                Text("You are a Pro Member")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("Your subscription is active. You have access to all features.")
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
                    .padding(.horizontal)
                
                Button("Manage Subscription") {
                    subscriptionManager.showManageSubscriptions()
                }
                .font(.headline)
                .foregroundColor(.blue)
                .padding(.top, 8)
            }
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
            .cornerRadius(16)
            .padding()
        } else if subscriptionManager.currentOffering != nil {
            VStack(spacing: 15) {
                if filteredPackages.isEmpty {
                    VStack(spacing: 8) {
                        Text("No eligible plans are available right now.")
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                        Button("Refresh") {
                            subscriptionManager.fetchOfferings()
                        }
                        .buttonStyle(.bordered)
                    }
                } else {
                    ForEach(filteredPackages) { package in
                        Button(action: {
                            subscriptionManager.purchase(package: package)
                        }) {
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(planName(for: package))
                                        .font(.headline)
                                    Text(package.storeProduct.localizedPriceString)
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                                Spacer()
                                Text(savingsBadge(for: package))
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
    }

    private var filteredPackages: [Package] {
        guard let currentOffering = subscriptionManager.currentOffering else { return [] }
        return currentOffering.availablePackages
            .filter {
                guard let unit = $0.storeProduct.subscriptionPeriod?.unit else { return false }
                return unit == .month || unit == .year
            }
            .sorted { lhs, rhs in
                let lhsUnit = lhs.storeProduct.subscriptionPeriod?.unit
                let rhsUnit = rhs.storeProduct.subscriptionPeriod?.unit
                if lhsUnit == rhsUnit { return lhs.storeProduct.price < rhs.storeProduct.price }
                return lhsUnit == .year
            }
    }

    private func planName(for package: Package) -> String {
        switch package.storeProduct.subscriptionPeriod?.unit {
        case .some(.year):
            return "Yearly (Best Value)"
        case .some(.month):
            return "Monthly"
        default:
            return package.storeProduct.productIdentifier
        }
    }

    private func savingsBadge(for package: Package) -> String {
        if package.storeProduct.subscriptionPeriod?.unit == .year {
            return "Save 20%"
        }
        return ""
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
