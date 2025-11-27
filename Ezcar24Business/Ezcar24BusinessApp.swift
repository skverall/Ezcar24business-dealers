//
//  Ezcar24BusinessApp.swift
//  Ezcar24Business
//
//  Created for UAE Car Resale Business Management
//

import SwiftUI
import Supabase
import RevenueCat

// Fallback provider to ensure RevenueCat keys are available even if the Services file
// is not part of the build target.
private enum RevenueCatKeyProvider {
    private static var productionKey: String {
        if let key = Bundle.main.object(forInfoDictionaryKey: "REVENUECAT_API_KEY") as? String, key.starts(with: "appl_") {
            return key
        }
        assertionFailure("Missing REVENUECAT_API_KEY with production key (appl_...) in Info.plist")
        return "appl_REPLACE_WITH_PRODUCTION_KEY"
    }

    private static let testKey: String = "test_PQldLAaiYEScNidjQWhejRHmOoo"

    static var currentKey: String {
        #if DEBUG
        return testKey
        #else
        return productionKey
        #endif
    }
}

@main
struct Ezcar24BusinessApp: App {
    @StateObject private var sessionStore: SessionStore
    @StateObject private var appSessionState: AppSessionState
    @StateObject private var cloudSyncManager: CloudSyncManager
    let persistenceController = PersistenceController.shared

    init() {
        // Initialize Supabase and Core Data
        let provider = SupabaseClientProvider()
        let sessionStore = SessionStore(client: provider.client, adminClient: provider.adminClient)
        let context = PersistenceController.shared.container.viewContext
        let syncManager = CloudSyncManager(client: provider.client, adminClient: provider.adminClient, context: context)

        CloudSyncManager.shared = syncManager
        SessionStoreEnvironment.shared = sessionStore

        _sessionStore = StateObject(wrappedValue: sessionStore)
        _appSessionState = StateObject(wrappedValue: AppSessionState(sessionStore: sessionStore))
        _cloudSyncManager = StateObject(wrappedValue: syncManager)
        
        // Initialize RevenueCat
        Purchases.logLevel = .debug
        let currentAppUserId = provider.client.auth.currentSession?.user.id.uuidString
        Purchases.configure(withAPIKey: RevenueCatKeyProvider.currentKey, appUserID: currentAppUserId)
    }

    var body: some Scene {
        WindowGroup {
            AuthGateView()
                .environmentObject(sessionStore)
                .environmentObject(appSessionState)
                .environmentObject(cloudSyncManager)
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
                .onOpenURL { url in
                    Task {
                        do {
                            try await sessionStore.handleDeepLink(url)
                        } catch {
                            print("Deep link error: \(error)")
                        }
                    }
                }
        }
    }
}
