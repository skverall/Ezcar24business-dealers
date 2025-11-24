import SwiftUI
import Supabase

struct AuthGateView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @EnvironmentObject private var cloudSyncManager: CloudSyncManager
    @StateObject private var subscriptionManager = SubscriptionManager.shared

    @State private var isGuest = false

    var body: some View {
        Group {
            // Priority 1: Show password reset if in recovery mode
            if sessionStore.showPasswordReset {
                PasswordResetView()
                    .environmentObject(sessionStore)
            }
            // Priority 2: Guest mode
            else if isGuest {
                ContentContainerView()
            }
            // Priority 3: Normal auth flow
            else {
                switch sessionStore.status {
                case .loading:
                    ProgressView("Checking session…")
                        .progressViewStyle(.circular)
                case .signedOut:
                    LoginView(isGuest: $isGuest)
                case .signedIn(let user):
                    if subscriptionManager.isProAccessActive {
                        ContentContainerView()
                            .task {
                                await cloudSyncManager.syncAfterLogin(user: user)
                            }
                    } else {
                        PaywallView()
                    }
                }
            }
        }
        .task {
            await sessionStore.bootstrap()
        }
        .animation(.easeInOut, value: sessionStore.status)
        .animation(.easeInOut, value: sessionStore.showPasswordReset)
        .animation(.easeInOut, value: isGuest)
        .onChange(of: sessionStore.status) { _, newStatus in
            if case .signedIn(let user) = newStatus {
                isGuest = false
                // Link RevenueCat user to restore subscription
                SubscriptionManager.shared.logIn(userId: user.id.uuidString)
                // Only sync if NOT in password recovery mode
                if !sessionStore.showPasswordReset {
                    Task {
                        await cloudSyncManager.syncAfterLogin(user: user)
                    }
                }
            }
        }
    }
}

private struct ContentContainerView: View {
    @EnvironmentObject private var sessionStore: SessionStore

    var body: some View {
        ContentView()
            .overlay(alignment: .top) {
                if sessionStore.shouldShowEmailReminderBanner {
                    EmailReminderBanner()
                }
            }
    }
}

private struct EmailReminderBanner: View {
    var body: some View {
        Text("Email is not verified yet. Please confirm your address to unlock all features.")
            .font(.footnote)
            .fontWeight(.semibold)
            .foregroundStyle(.white)
            .padding()
            .frame(maxWidth: .infinity)
            .background(Color.orange)
            .shadow(radius: 4)
            .padding()
    }
}
