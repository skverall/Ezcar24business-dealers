import SwiftUI
import RevenueCat

struct PaywallView: View {
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @EnvironmentObject private var sessionStore: SessionStore
    @EnvironmentObject private var appSessionState: AppSessionState
    @EnvironmentObject private var cloudSyncManager: CloudSyncManager
    @Environment(\.dismiss) private var dismiss

    // Animation States
    @State private var animateContent: Bool = false
    @State private var selectedPackage: Package?

    private var isSignedIn: Bool {
        if case .signedIn = sessionStore.status { return true }
        return false
    }

    private var isGuest: Bool {
        appSessionState.isGuestMode && !isSignedIn
    }

    var body: some View {
        ZStack {
            // Background
            ColorTheme.background.ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 0) {
                    // 1. Premium Header
                    headerSection
                        .opacity(animateContent ? 1 : 0)
                        .offset(y: animateContent ? 0 : -20)
                    
                    VStack(spacing: 24) {
                        // 2. Value Proposition / Features
                        featuresSection
                            .opacity(animateContent ? 1 : 0)
                            .offset(y: animateContent ? 0 : 20)
                        
                        // 3. Plan Selection
                        if isSignedIn {
                            planSelectionSection
                                .opacity(animateContent ? 1 : 0)
                                .offset(y: animateContent ? 0 : 30)
                        } else {
                            guestGate
                                .opacity(animateContent ? 1 : 0)
                                .offset(y: animateContent ? 0 : 30)
                        }
                        
                        // 4. Trust / Social Proof
                        trustSection
                            .opacity(animateContent ? 1 : 0)
                    }
                    .padding(.top, 20)
                    .padding(.bottom, 100) // Space for sticky button
                }
            }
            .ignoresSafeArea(.container, edges: .top)
            
            // 5. Sticky CTA Button
            if isSignedIn {
                VStack {
                    Spacer()
                    ctaButton
                        .padding(.horizontal, 20)
                        .padding(.bottom, 20)
                        .opacity(animateContent ? 1 : 0)
                        .offset(y: animateContent ? 0 : 50)
                }
            }
            
            // Close Button
            VStack {
                HStack {
                    Spacer()
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white.opacity(0.8))
                            .padding(8)
                            .background(.black.opacity(0.3))
                            .clipShape(Circle())
                    }
                    .padding(.top, 50)
                    .padding(.trailing, 20)
                }
                Spacer()
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.8, dampingFraction: 0.8).delay(0.1)) {
                animateContent = true
            }
            
            if isSignedIn && subscriptionManager.currentOffering == nil {
                subscriptionManager.fetchOfferings()
            }
            
            // Pre-select the best value plan (Yearly) if available
            if let offering = subscriptionManager.currentOffering {
                selectedPackage = offering.availablePackages.first(where: { $0.storeProduct.subscriptionPeriod?.unit == .year }) 
                                ?? offering.availablePackages.first
            }
        }
        .onChange(of: subscriptionManager.currentOffering) { _, newOffering in
            if let offering = newOffering, selectedPackage == nil {
                selectedPackage = offering.availablePackages.first(where: { $0.storeProduct.subscriptionPeriod?.unit == .year }) 
                                ?? offering.availablePackages.first
            }
        }
        .onChange(of: subscriptionManager.isProAccessActive) { _, isPro in
            if isPro { dismiss() }
        }
    }
    
    // MARK: - Sections
    
    private var headerSection: some View {
        ZStack(alignment: .bottom) {
            // Dynamic Gradient Background
            LinearGradient(
                colors: [Color(hex: "4A00E0"), Color(hex: "8E2DE2")], // Purple/Blue gradient
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .frame(height: 320)
            .mask(
                CustomShape(corner: [.bottomLeft, .bottomRight], radii: 40)
            )
            
            VStack(spacing: 12) {
                // Icon
                ZStack {
                    Circle()
                        .fill(.white.opacity(0.2))
                        .frame(width: 100, height: 100)
                        .blur(radius: 10)
                    
                    Image(systemName: "crown.fill")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 50, height: 50)
                        .foregroundColor(.white)
                        .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
                }
                .padding(.bottom, 10)
                
                Text("Upgrade to Pro")
                    .font(.system(size: 32, weight: .heavy, design: .rounded))
                    .foregroundColor(.white)
                
                Text("Unlock unlimited potential for your\ndealership business.")
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .foregroundColor(.white.opacity(0.9))
                    .padding(.horizontal, 40)
                    .padding(.bottom, 40)
            }
        }
    }
    
    private var featuresSection: some View {
        VStack(spacing: 16) {
            Text("WHAT YOU GET")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.secondary)
                .tracking(2)
            
            VStack(spacing: 12) {
                PremiumFeatureRow(icon: "car.fill", title: "Unlimited Vehicles", subtitle: "Add as many cars as you want")
                PremiumFeatureRow(icon: "icloud.fill", title: "Cloud Sync", subtitle: "Access your data on all devices")
                PremiumFeatureRow(icon: "doc.text.fill", title: "PDF Reports", subtitle: "Generate professional invoices")
                PremiumFeatureRow(icon: "chart.bar.fill", title: "Advanced Analytics", subtitle: "Track your profit and growth")
            }
            .padding(.horizontal, 20)
        }
    }
    
    private var planSelectionSection: some View {
        VStack(spacing: 16) {
            Text("CHOOSE YOUR PLAN")
                .font(.caption)
                .fontWeight(.bold)
                .foregroundColor(.secondary)
                .tracking(2)
            
            if subscriptionManager.isLoading {
                ProgressView()
                    .padding()
            } else if let offering = subscriptionManager.currentOffering {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(filteredPackages(offering.availablePackages)) { package in
                            PlanCard(
                                package: package,
                                isSelected: selectedPackage?.identifier == package.identifier,
                                action: {
                                    withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                                        selectedPackage = package
                                    }
                                }
                            )
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10) // Space for shadows
                }
            } else {
                Text("Unable to load plans")
                    .foregroundColor(.secondary)
                    .font(.caption)
                Button("Retry") { subscriptionManager.fetchOfferings() }
                    .font(.caption)
            }
            
            // Restore Button
            Button(action: { subscriptionManager.restorePurchases() }) {
                Text(subscriptionManager.isRestoring ? "Restoring..." : "Restore Purchases")
                    .font(.footnote)
                    .foregroundColor(.secondary)
                    .underline()
            }
            .disabled(subscriptionManager.isRestoring)
            .padding(.top, 8)
        }
    }
    
    private var guestGate: some View {
        VStack(spacing: 20) {
            Image(systemName: "lock.fill")
                .font(.system(size: 40))
                .foregroundColor(.secondary)
                .padding()
                .background(Color.secondary.opacity(0.1))
                .clipShape(Circle())
            
            Text("Sign in to view plans")
                .font(.headline)
            
            Button {
                appSessionState.exitGuestModeForLogin()
                dismiss()
            } label: {
                Text("Go to Login")
                    .fontWeight(.bold)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(ColorTheme.primary)
                    .foregroundColor(.white)
                    .cornerRadius(16)
            }
            .padding(.horizontal, 40)
        }
        .padding(.vertical, 20)
    }
    
    private var trustSection: some View {
        HStack(spacing: 4) {
            Image(systemName: "shield.fill")
                .foregroundColor(.green)
            Text("Secured by App Store")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.top, 10)
    }
    
    private var ctaButton: some View {
        Button(action: {
            if let pkg = selectedPackage {
                subscriptionManager.purchase(package: pkg)
            }
        }) {
            HStack {
                if subscriptionManager.isPurchasing {
                    ProgressView().tint(.white)
                }
                Text(ctaText)
                    .font(.headline)
                    .fontWeight(.bold)
            }
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(
                LinearGradient(
                    colors: [Color(hex: "4A00E0"), Color(hex: "8E2DE2")],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(20)
            .shadow(color: Color(hex: "4A00E0").opacity(0.4), radius: 10, y: 5)
        }
        .disabled(selectedPackage == nil || subscriptionManager.isPurchasing)
    }
    
    private var ctaText: String {
        if subscriptionManager.isPurchasing { return "Processing..." }
        guard let pkg = selectedPackage else { return "Select a Plan" }
        
        if pkg.storeProduct.subscriptionPeriod?.unit == .year {
            return "Start 1 Week Free Trial"
        } else {
            return "Continue"
        }
    }
    
    // MARK: - Helpers
    
    private func filteredPackages(_ packages: [Package]) -> [Package] {
        packages
            .filter {
                guard let unit = $0.storeProduct.subscriptionPeriod?.unit else { return true } // Allow lifetime
                return unit == .month || unit == .year
            }
            .sorted { lhs, rhs in
                // Sort: Monthly -> Yearly -> Lifetime
                let lhsType = sortOrder(for: lhs)
                let rhsType = sortOrder(for: rhs)
                return lhsType < rhsType
            }
    }
    
    private func sortOrder(for package: Package) -> Int {
        if package.storeProduct.productType == .nonConsumable { return 3 } // Lifetime last
        if package.storeProduct.subscriptionPeriod?.unit == .year { return 2 }
        return 1 // Monthly first
    }
}

// MARK: - Subviews

struct PremiumFeatureRow: View {
    let icon: String
    let title: String
    let subtitle: String
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(ColorTheme.primary.opacity(0.1))
                    .frame(width: 44, height: 44)
                
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(ColorTheme.primary)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundColor(ColorTheme.primaryText)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(ColorTheme.secondaryText)
            }
            
            Spacer()
        }
        .padding(12)
        .background(ColorTheme.cardBackground)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.02), radius: 5, x: 0, y: 2)
    }
}

struct PlanCard: View {
    let package: Package
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 12) {
                // Header Badge
                HStack {
                    if isBestValue {
                        Text("BEST VALUE")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.green)
                            .cornerRadius(8)
                    } else if isLifetime {
                        Text("ONE TIME")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.orange)
                            .cornerRadius(8)
                    } else {
                        Spacer().frame(height: 20)
                    }
                    Spacer()
                    if isSelected {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(ColorTheme.primary)
                    } else {
                        Circle()
                            .stroke(Color.secondary.opacity(0.3), lineWidth: 2)
                            .frame(width: 20, height: 20)
                    }
                }
                
                // Title
                Text(planTitle)
                    .font(.headline)
                    .foregroundColor(ColorTheme.primaryText)
                
                // Price
                VStack(alignment: .leading, spacing: 2) {
                    Text(package.storeProduct.localizedPriceString)
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(ColorTheme.primaryText)
                    
                    if let period = package.storeProduct.subscriptionPeriod {
                        Text("/ \(period.unit == .year ? "year" : "month")")
                            .font(.caption)
                            .foregroundColor(ColorTheme.secondaryText)
                    } else {
                         Text("once")
                            .font(.caption)
                            .foregroundColor(ColorTheme.secondaryText)
                    }
                }
                
                // Savings/Trial Info
                if isBestValue {
                    Text("7 Days Free Trial")
                        .font(.caption2)
                        .fontWeight(.medium)
                        .foregroundColor(ColorTheme.primary)
                } else {
                    Text("Standard Plan")
                        .font(.caption2)
                        .foregroundColor(.clear) // Keep layout consistent
                }
            }
            .padding(16)
            .frame(width: 160, height: 180)
            .background(isSelected ? ColorTheme.cardBackground : ColorTheme.background)
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(isSelected ? ColorTheme.primary : Color.clear, lineWidth: 2)
            )
            .shadow(color: isSelected ? ColorTheme.primary.opacity(0.2) : Color.black.opacity(0.05), radius: 10, y: 5)
        }
        .buttonStyle(.plain)
        .scaleEffect(isSelected ? 1.05 : 1.0)
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isSelected)
    }
    
    var isBestValue: Bool {
        package.storeProduct.subscriptionPeriod?.unit == .year
    }
    
    var isLifetime: Bool {
        package.storeProduct.productType == .nonConsumable
    }
    
    var planTitle: String {
        if isLifetime { return "Lifetime" }
        if package.storeProduct.subscriptionPeriod?.unit == .year { return "Yearly" }
        return "Monthly"
    }
}

// Custom Shape for Header
struct CustomShape: Shape {
    var corner: UIRectCorner
    var radii: CGFloat
    
    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corner,
            cornerRadii: CGSize(width: radii, height: radii)
        )
        return Path(path.cgPath)
    }
}

// Color Hex Helper
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

struct PaywallView_Previews: PreviewProvider {
    static var previews: some View {
        PaywallView()
    }
}
