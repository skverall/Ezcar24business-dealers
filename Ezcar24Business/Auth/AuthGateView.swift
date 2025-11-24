import SwiftUI
import Supabase

struct AuthGateView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @EnvironmentObject private var cloudSyncManager: CloudSyncManager
    @StateObject private var subscriptionManager = SubscriptionManager.shared

    @State private var isGuest = false

    var body: some View {
        Group {
            if isGuest {
                ContentContainerView()
            } else {
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
        .animation(.easeInOut, value: isGuest)
        .onChange(of: sessionStore.status) { _, newStatus in
            if case .signedIn(let user) = newStatus {
                isGuest = false
                Task {
                    await cloudSyncManager.syncAfterLogin(user: user)
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
