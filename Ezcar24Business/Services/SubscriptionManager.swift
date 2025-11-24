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
    @Published var restoreStatus: RestoreStatus = .idle
    
    enum RestoreStatus: Equatable {
        case idle
        case success
        case error(String)
        case noPurchases
    }
    
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
        self.restoreStatus = .idle
        
        Purchases.shared.restorePurchases { [weak self] (customerInfo, error) in
            guard let self = self else { return }
            self.isLoading = false
            
            if let error = error {
                self.errorMessage = error.localizedDescription
                self.restoreStatus = .error(error.localizedDescription)
            } else if let customerInfo = customerInfo {
                self.updateProStatus(from: customerInfo)
                
                if !customerInfo.entitlements.active.isEmpty {
                    self.restoreStatus = .success
                } else {
                    self.restoreStatus = .noPurchases
                }
            }
        }
    }
    
    func logIn(userId: String) {
        Purchases.shared.logIn(userId) { [weak self] (customerInfo, created, error) in
            guard let self = self else { return }
            if let error = error {
                print("RevenueCat login error: \(error.localizedDescription)")
            } else if let customerInfo = customerInfo {
                self.updateProStatus(from: customerInfo)
            }
        }
    }
    
    func logOut() {
        Purchases.shared.logOut { [weak self] (customerInfo, error) in
            guard let self = self else { return }
            if let error = error {
                print("RevenueCat logout error: \(error.localizedDescription)")
            } else if let customerInfo = customerInfo {
                self.updateProStatus(from: customerInfo)
            }
        }
    }
    
    private func updateProStatus(from customerInfo: CustomerInfo) {
        DispatchQueue.main.async {
            self.customerInfo = customerInfo
            // CRITICAL FIX: Check if ANY entitlement is active.
            // This solves the issue where the specific entitlement name might differ (e.g. "pro" vs "monthly").
            // If the user has paid for ANYTHING that is currently active, they get access.
            self.isProAccessActive = !customerInfo.entitlements.active.isEmpty
        }
    }
}
