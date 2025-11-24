import Foundation
import RevenueCat
import SwiftUI

class SubscriptionManager: ObservableObject {
    static let shared = SubscriptionManager()
    
    @Published var isProAccessActive: Bool = false
    @Published var currentOffering: Offering?
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var customerInfo: CustomerInfo?
    
    private init() {
        // Check status on launch
        checkSubscriptionStatus()
    }
    
    func checkSubscriptionStatus() {
        Purchases.shared.getCustomerInfo { [weak self] (customerInfo, error) in
            guard let self = self else { return }
            if let customerInfo = customerInfo {
                self.updateProStatus(from: customerInfo)
            }
        }
    }
    
    func fetchOfferings() {
        self.isLoading = true
        Purchases.shared.getOfferings { [weak self] (offerings, error) in
            guard let self = self else { return }
            self.isLoading = false
            if let error = error {
                self.errorMessage = error.localizedDescription
                print("Error fetching offerings: \(error.localizedDescription)")
            } else if let offerings = offerings {
                self.currentOffering = offerings.current
                print("Offerings fetched: \(offerings.current?.identifier ?? "None")")
            }
        }
    }
    
    func purchase(package: Package) {
        self.isLoading = true
        Purchases.shared.purchase(package: package) { [weak self] (transaction, customerInfo, error, userCancelled) in
            guard let self = self else { return }
            self.isLoading = false
            
            if let error = error {
                if !userCancelled {
                    self.errorMessage = error.localizedDescription
                }
            } else if let customerInfo = customerInfo {
                self.updateProStatus(from: customerInfo)
            }
        }
    }
    
    func restorePurchases() {
        self.isLoading = true
        Purchases.shared.restorePurchases { [weak self] (customerInfo, error) in
            guard let self = self else { return }
            self.isLoading = false
            
            if let error = error {
                self.errorMessage = error.localizedDescription
            } else if let customerInfo = customerInfo {
                self.updateProStatus(from: customerInfo)
            }
        }
    }
    
    private func updateProStatus(from customerInfo: CustomerInfo) {
        DispatchQueue.main.async {
            self.customerInfo = customerInfo
        }
        // "pro" is the entitlement identifier we will configure in RevenueCat dashboard
        if customerInfo.entitlements["pro"]?.isActive == true {
            DispatchQueue.main.async {
                self.isProAccessActive = true
            }
        } else {
            DispatchQueue.main.async {
                self.isProAccessActive = false
            }
        }
    }
}
