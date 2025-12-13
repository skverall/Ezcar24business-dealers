import Foundation
import UIKit

/// Service to check App Store for latest version and determine if update is required
@MainActor
final class AppStoreVersionChecker: ObservableObject {
    static let shared = AppStoreVersionChecker()
    
    @Published var isUpdateRequired = false
    @Published private(set) var appStoreVersion: String?
    @Published private(set) var appStoreURL: URL?
    @Published private(set) var appStoreTrackId: Int?
    @Published private(set) var isChecking = false
    
    private let bundleId = Bundle.main.bundleIdentifier ?? "com.ezcar24.business"
    
    private init() {}
    
    /// Current app version from Info.plist
    var currentVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0"
    }
    
    /// Check App Store for updates
    func checkForUpdate() async {
        isChecking = true
        defer { isChecking = false }
        
        guard let url = URL(string: "https://itunes.apple.com/lookup?bundleId=\(bundleId)") else {
            return
        }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(AppStoreLookupResponse.self, from: data)
            
            guard let result = response.results.first else {
                // App not found in App Store (might not be published yet)
                return
            }
            
            appStoreVersion = result.version
            appStoreTrackId = result.trackId
            appStoreURL = makeAppStoreURL(trackId: result.trackId, trackViewUrl: result.trackViewUrl)
            
            // Compare versions
            if isVersion(result.version, greaterThan: currentVersion) {
                isUpdateRequired = true
            } else {
                isUpdateRequired = false
            }
        } catch {
            print("Failed to check App Store version: \(error)")
        }
    }
    
    /// Open App Store page
    func openAppStore() {
        if let url = appStoreURL {
            UIApplication.shared.open(url)
            return
        }
        if let trackId = appStoreTrackId,
           let url = URL(string: "https://apps.apple.com/app/id\(trackId)") {
            UIApplication.shared.open(url)
        }
    }
    
    /// Compare two version strings (e.g., "1.2.3" vs "1.2.2")
    private func isVersion(_ v1: String, greaterThan v2: String) -> Bool {
        let v1Components = v1.split(separator: ".").compactMap { Int($0) }
        let v2Components = v2.split(separator: ".").compactMap { Int($0) }
        
        let maxCount = max(v1Components.count, v2Components.count)
        
        for i in 0..<maxCount {
            let v1Part = i < v1Components.count ? v1Components[i] : 0
            let v2Part = i < v2Components.count ? v2Components[i] : 0
            
            if v1Part > v2Part {
                return true
            } else if v1Part < v2Part {
                return false
            }
        }
        
        return false
    }

    private func makeAppStoreURL(trackId: Int?, trackViewUrl: String?) -> URL? {
        if let trackId, let url = URL(string: "itms-apps://itunes.apple.com/app/id\(trackId)") {
            return url
        }
        if let trackViewUrl, let url = URL(string: trackViewUrl) {
            return url
        }
        return nil
    }
}

// MARK: - App Store API Response Models

private struct AppStoreLookupResponse: Decodable {
    let resultCount: Int
    let results: [AppStoreResult]
}

private struct AppStoreResult: Decodable {
    let version: String
    let trackViewUrl: String?
    let trackId: Int?
}
