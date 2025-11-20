import SwiftUI
import Supabase

struct AccountView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @EnvironmentObject private var appSessionState: AppSessionState
    @State private var isSigningOut = false

    var body: some View {
        NavigationStack {
            ZStack {
                ColorTheme.background.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        accountHeader
                        
                        VStack(spacing: 16) {
                            menuSection(title: "Finance") {
                                NavigationLink {
                                    FinancialAccountsView()
                                } label: {
                                    MenuRow(icon: "banknote", title: "Financial Accounts", color: .green)
                                }
                            }
                            
                            menuSection(title: "Management") {
                                NavigationLink {
                                    UserManagementView()
                                } label: {
                                    MenuRow(icon: "person.2.fill", title: "Team Members", color: .blue)
                                }

                                NavigationLink {
                                    BackupCenterView()
                                } label: {
                                    MenuRow(icon: "externaldrive.badge.checkmark", title: "Backup & Export", color: .orange)
                                }
                            }
                            
                            menuSection(title: "Account") {
                                Button(action: signOut) {
                                    HStack {
                                        MenuRow(icon: "rectangle.portrait.and.arrow.right", title: "Sign Out", color: .red)
                                        if isSigningOut || sessionStore.isAuthenticating {
                                            Spacer()
                                            ProgressView()
                                                .progressViewStyle(.circular)
                                        }
                                    }
                                }
                                .disabled(isSigningOut || sessionStore.isAuthenticating)
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                    .padding(.vertical, 20)
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    @ViewBuilder
    private var accountHeader: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(ColorTheme.primary.opacity(0.1))
                    .frame(width: 100, height: 100)
                
                Text(userInitials)
                    .font(.system(size: 36, weight: .bold))
                    .foregroundColor(ColorTheme.primary)
            }
            
            VStack(spacing: 4) {
                if case .signedIn(let user) = sessionStore.status {
                    Text(user.email ?? "User")
                        .font(.title3)
                        .fontWeight(.semibold)
                        .foregroundColor(ColorTheme.primaryText)
                    
                    Text("Member since \(user.createdAt, style: .date)")
                        .font(.caption)
                        .foregroundColor(ColorTheme.secondaryText)
                    
                    if (user.emailConfirmedAt as Date?) != nil {
                        HStack(spacing: 4) {
                            Image(systemName: "checkmark.seal.fill")
                                .foregroundColor(ColorTheme.success)
                            Text("Verified Account")
                                .foregroundColor(ColorTheme.success)
                        }
                        .font(.caption)
                        .fontWeight(.medium)
                        .padding(.top, 4)
                    }
                } else {
                    Text("Not Signed In")
                        .font(.headline)
                        .foregroundColor(ColorTheme.secondaryText)
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .background(ColorTheme.cardBackground)
        .cornerRadius(20)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 5)
        .padding(.horizontal, 16)
    }
    
    private func menuSection<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.caption)
                .fontWeight(.bold)
                .textCase(.uppercase)
                .foregroundColor(ColorTheme.secondaryText)
                .padding(.leading, 8)
            
            VStack(spacing: 1) {
                content()
            }
            .background(ColorTheme.cardBackground)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.03), radius: 5, x: 0, y: 2)
        }
    }
    
    private var userInitials: String {
        if case .signedIn(let user) = sessionStore.status, let email = user.email {
            return String(email.prefix(2)).uppercased()
        }
        return "??"
    }

    private func signOut() {
        guard !isSigningOut else { return }
        isSigningOut = true

        Task {
            await sessionStore.signOut()

            await MainActor.run {
                appSessionState.mode = .signIn
                appSessionState.email = ""
                appSessionState.password = ""
                isSigningOut = false
            }
        }
    }
}

struct MenuRow: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.1))
                    .frame(width: 36, height: 36)
                
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundColor(color)
            }
            
            Text(title)
                .font(.body)
                .foregroundColor(ColorTheme.primaryText)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(ColorTheme.tertiaryText)
        }
        .padding(16)
    }
}
