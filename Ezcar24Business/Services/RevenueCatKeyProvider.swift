//
//  RevenueCatKeyProvider.swift
//  Ezcar24Business
//
//  Centralizes API key selection for RevenueCat to avoid using test keys in release builds.
//

import Foundation

enum RevenueCatKeyProvider {
    // Replace with your production RevenueCat public API key (starts with "appl_")
    private static let productionKey: String = {
        if let key = Bundle.main.object(forInfoDictionaryKey: "REVENUECAT_API_KEY") as? String, key.starts(with: "appl_") {
            return key
        }
        // Fallback placeholder to avoid accidental test key usage; will log an assertion in release.
        assertionFailure("Missing REVENUECAT_API_KEY with production key (appl_...) in Info.plist")
        return "appl_REPLACE_WITH_PRODUCTION_KEY"
    }()

    // Debug/staging key for simulator/TestFlight testing
    private static let testKey: String = "test_PQldLAaiYEScNidjQWhejRHmOoo"

    static var currentKey: String {
        #if DEBUG
        return testKey
        #else
        return productionKey
        #endif
    }
}
