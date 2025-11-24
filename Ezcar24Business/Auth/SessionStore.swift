import Foundation
import Supabase

@MainActor
final class SessionStore: ObservableObject {
    enum Status: Equatable {
        case loading
        case signedOut
        case signedIn(user: Auth.User)
    }

    @Published private(set) var status: Status = .loading
    @Published private(set) var isAuthenticating = false
    @Published var errorMessage: String?
    @Published var showPasswordReset = false

    private let client: SupabaseClient
    private let adminClient: SupabaseClient?
    private var authChangeTask: Task<Void, Never>?
    private var didBootstrap = false

    init(client: SupabaseClient, adminClient: SupabaseClient?) {
        self.client = client
        self.adminClient = adminClient
        listenForAuthChanges()
    }

    deinit {
        authChangeTask?.cancel()
    }

    var shouldShowEmailReminderBanner: Bool {
        guard case .signedIn(let user) = status else { return false }

        // Supabase Swift exposes userMetadata as [String: AnyJSON]. Convert helpers
        func value<T>(_ key: String, as type: T.Type) -> T? {
            guard let any = user.userMetadata[key] else { return nil }
            // Try decoding the AnyJSON payload into the requested type
            if let val = any.value as? T { return val }
            // Fallback: try to serialize to Data then decode
            do {
                let data = try JSONSerialization.data(withJSONObject: any.value, options: [])
                if T.self == String.self, let str = String(data: data, encoding: .utf8) as? T { return str }
            } catch { }
            return nil
        }

        // 1) Booleans commonly used to mark confirmation
        if let emailConfirmed: Bool = value("email_confirmed", as: Bool.self) {
            return !emailConfirmed
        }
        if let isVerified: Bool = value("is_verified", as: Bool.self) {
            return !isVerified
        }

        // 2) Timestamp as ISO8601 string (Supabase often stores strings)
        if let confirmedAtString: String = value("email_confirmed_at", as: String.self) {
            let trimmed = confirmedAtString.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty {
                let iso = ISO8601DateFormatter()
                if iso.date(from: trimmed) != nil { return false }
                return false
            }
        }

        // 3) Or sometimes a numeric epoch seconds
        if let epoch: Double = value("email_confirmed_at", as: Double.self) {
            if epoch > 0 { return false }
        }

        // 4) Or a Date object in metadata (rare)
        if let _: Date = value("email_confirmed_at", as: Date.self) {
            return false
        }

        // If unknown, do not show banner to avoid false positives
        return false
    }

    func bootstrap() async {
        guard !didBootstrap else { return }
        didBootstrap = true

        if let currentSession = client.auth.currentSession {
            if currentSession.isExpired {
                do {
                    let refreshed = try await client.auth.refreshSession()
                    updateStatus(for: .tokenRefreshed, session: refreshed)
                    errorMessage = nil
                } catch {
                    status = .signedOut
                    errorMessage = localized(error)
                }
            } else {
                updateStatus(for: .initialSession, session: currentSession)
                // Link RevenueCat user on launch
                SubscriptionManager.shared.logIn(userId: currentSession.user.id.uuidString)
                errorMessage = nil
            }
        } else {
            status = .signedOut
            errorMessage = nil
        }
    }

    func signIn(email: String, password: String) async throws {
        isAuthenticating = true
        defer { isAuthenticating = false }
        do {
            let session = try await client.auth.signIn(email: email, password: password)
            updateStatus(for: .signedIn, session: session)
            // Link RevenueCat user
            SubscriptionManager.shared.logIn(userId: session.user.id.uuidString)
            errorMessage = nil
        } catch {
            errorMessage = localized(error)
            throw error
        }
    }

    func signUp(email: String, password: String) async throws {
        isAuthenticating = true
        defer { isAuthenticating = false }
        do {
            let response = try await client.auth.signUp(email: email, password: password)

            if let session = response.session {
                updateStatus(for: .signedIn, session: session)
                // Link RevenueCat user
                SubscriptionManager.shared.logIn(userId: session.user.id.uuidString)
                errorMessage = nil
                return
            }

            if let adminClient {
                do {
                    let userID = response.user.id
                    _ = try await adminClient.auth.admin.updateUserById(
                        userID,
                        attributes: AdminUserAttributes(emailConfirm: true)
                    )
                    let session = try await client.auth.signIn(email: email, password: password)
                    updateStatus(for: .signedIn, session: session)
                    // Link RevenueCat user
                    SubscriptionManager.shared.logIn(userId: session.user.id.uuidString)
                    errorMessage = nil
                } catch {
                    errorMessage = localized(error)
                    throw error
                }
            } else {
                status = .signedOut
                errorMessage = "Please confirm your email via the link sent before signing in."
            }
        } catch {
            errorMessage = localized(error)
            throw error
        }
    }

    func signOut() async {
        isAuthenticating = true
        defer { isAuthenticating = false }
        do {
            try await client.auth.signOut()
            status = .signedOut
            // Logout from RevenueCat
            SubscriptionManager.shared.logOut()
            // IMPORTANT: For this app we must fully isolate data between users/guests.
            // After sign out we wipe all local Core Data entities and clear the
            // offline sync queue so operations from the previous user are never
            // replayed for the next user.
            PersistenceController.shared.deleteAllData()
            Task {
                await SyncQueueManager.shared.clear()
            }
            UserDefaults.standard.removeObject(forKey: "lastSyncTimestamp")
            ImageStore.shared.clearAll()
            errorMessage = nil
        } catch {
            errorMessage = localized(error)
        }
    }

    func updatePassword(_ newPassword: String) async throws {
        isAuthenticating = true
        defer { isAuthenticating = false }
        do {
            try await client.auth.update(user: UserAttributes(password: newPassword))
            errorMessage = nil
        } catch {
            errorMessage = localized(error)
            throw error
        }
    }

    func resetPassword(email: String) async throws {
        isAuthenticating = true
        defer { isAuthenticating = false }
        do {
            // Explicitly tell Supabase where to redirect back to the app
            let redirectURL = URL(string: "com.ezcar24.business://login-callback")
            try await client.auth.resetPasswordForEmail(email, redirectTo: redirectURL)
            errorMessage = nil
        } catch {
            errorMessage = localized(error)
            throw error
        }
    }

    func deleteAccount() async throws {
        guard case .signedIn(let user) = status else { return }
        isAuthenticating = true
        defer { isAuthenticating = false }
        
        do {
            // If we have an admin client, use it to delete the user (more reliable)
            if let adminClient {
                try await adminClient.auth.admin.deleteUser(id: user.id)
            } else {
                // Otherwise try self-deletion (requires RLS policy)
                // Note: Supabase Auth doesn't have a direct "delete self" in client SDK usually,
                // but we can try calling an edge function or RPC if set up.
                // However, for this codebase, we'll try the standard client method if available or fallback.
                // Actually, standard client SDK usually doesn't allow deleting self for security without specific config.
                // But let's assume standard behavior or admin client presence.
                // If no admin client, we might need to rely on a backend function.
                // For now, let's try to use the admin client if available, or throw an error if not.
                // Since this is a "Business" app, maybe we can assume admin privileges or just sign out.
                
                // WAIT: The user asked for "correct setup".
                // Best practice for "Delete Account" without backend function is often just marking as deleted in DB
                // or using a specific Edge Function.
                // But let's check if we can use the admin client (which we have in this app).
                throw NSError(domain: "Ezcar24Business", code: 403, userInfo: [NSLocalizedDescriptionKey: "Account deletion requires admin privileges or contact support."])
            }
            
            status = .signedOut
            errorMessage = nil
        } catch {
            errorMessage = localized(error)
            throw error
        }
    }

    func resetError() {
        errorMessage = nil
    }

    func handleDeepLink(_ url: URL) async throws {
        // Check if this is a password recovery link
        let urlString = url.absoluteString
        if urlString.contains("type=recovery") || urlString.contains("recovery") {
            // This is a password reset link
            try await client.handle(url)
            // Show password reset UI
            showPasswordReset = true
        } else {
            // Regular magic link or other auth link
            try await client.handle(url)
        }
    }

    private func listenForAuthChanges() {
        authChangeTask?.cancel()
        authChangeTask = Task { [weak self] in
            guard let self else { return }

            for await change in client.auth.authStateChanges {
                self.updateStatus(for: change.event, session: change.session)
            }
        }
    }

    private func updateStatus(for event: AuthChangeEvent, session: Session?) {
        switch event {
        case .initialSession, .tokenRefreshed, .userUpdated, .signedIn:
            if let session {
                status = .signedIn(user: session.user)
                errorMessage = nil
            } else {
                status = .signedOut
                errorMessage = nil
            }
        case .signedOut, .userDeleted:
            status = .signedOut
            errorMessage = nil
        case .passwordRecovery:
            // User clicked password reset link - show the reset UI
            if let session {
                status = .signedIn(user: session.user)
                showPasswordReset = true
                errorMessage = nil
            }
        case .mfaChallengeVerified:
            break
        }
    }

    private func localized(_ error: Error) -> String {
        if let localized = error as? LocalizedError, let description = localized.errorDescription {
            return prettify(description)
        }
        return prettify(error.localizedDescription)
    }

    private func prettify(_ message: String) -> String {
        if message.contains("gmail.com") && message.contains("invalid") {
            return "Supabase rejects gmail addresses shorter than 6 characters before the @. Add characters before @ or use another email."
        }
        return message
    }
}
