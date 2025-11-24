//
//  Ezcar24BusinessApp.swift
//  Ezcar24Business
//
//  Created for UAE Car Resale Business Management
//

import SwiftUI
import Supabase
import RevenueCat

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
        // REPLACE 'appl_api_key' WITH YOUR ACTUAL REVENUECAT PUBLIC API KEY
        Purchases.logLevel = .debug
        Purchases.configure(withAPIKey: "test_PQldLAaiYEScNidjQWhejRHmOoo")
    }

    var body: some Scene {
        WindowGroup {
            AuthGateView()
                .environmentObject(sessionStore)
                .environmentObject(appSessionState)
                .environmentObject(cloudSyncManager)
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
