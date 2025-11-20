import SwiftUI
import Supabase

struct AuthGateView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @EnvironmentObject private var cloudSyncManager: CloudSyncManager

    var body: some View {
        Group {
            switch sessionStore.status {
            case .loading:
                ProgressView("Checking session…")
                    .progressViewStyle(.circular)
            case .signedOut:
                LoginView()
            case .signedIn(let user):
                ContentContainerView()
                    .task {
                        await cloudSyncManager.syncAfterLogin(user: user)
                    }
            }
        }
        .task {
            await sessionStore.bootstrap()
        }
        .animation(.easeInOut, value: sessionStore.status)
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
