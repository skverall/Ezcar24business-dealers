import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @EnvironmentObject private var appSessionState: AppSessionState
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @Binding var isGuest: Bool
    @State private var showingPaywall = false
    @FocusState private var focusedField: Field?

    init(isGuest: Binding<Bool> = .constant(false)) {
        _isGuest = isGuest
    }

    private enum Field {
        case email
        case password
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Supabase Authentication")) {
                    Picker("Mode", selection: $appSessionState.mode) {
                        Text("Sign In").tag(AppSessionState.Mode.signIn)
                        Text("Sign Up").tag(AppSessionState.Mode.signUp)
                    }
                    .pickerStyle(.segmented)

                    TextField("Email", text: $appSessionState.email)
                        .keyboardType(.emailAddress)
                        .textContentType(.username)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .focused($focusedField, equals: .email)

                    SecureField("Password", text: $appSessionState.password)
                        .textContentType(appSessionState.mode == .signUp ? .newPassword : .password)
                        .focused($focusedField, equals: .password)
                }

                if let message = sessionStore.errorMessage {
                    Section {
                        Text(message)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }

                Section {
                    Button(action: triggerAuth) {
                        HStack {
                            if appSessionState.isProcessing || sessionStore.isAuthenticating {
                                ProgressView()
                                    .progressViewStyle(.circular)
                            }

                            Text(appSessionState.mode == .signIn ? "Sign In" : "Create Account")
                        }
                    }
                    .disabled(appSessionState.isProcessing || sessionStore.isAuthenticating || !appSessionState.isFormValid)
                }
                
                Section {
                    Button("Restore Purchases") {
                        subscriptionManager.restorePurchases()
                    }
                }

                Section {
                    Button("Continue Offline (Guest Mode)") {
                        isGuest = true
                    }
                    .foregroundColor(.secondary)
                }
                
                // TEMPORARY DEBUG SECTION
                Section(header: Text("Debug Tools")) {
                    Button("Force Reset Password (Admin)") {
                        Task {
                            await forceResetPassword()
                        }
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Supabase Auth")
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Done") {
                        focusedField = nil
                    }
                }
            }
            .sheet(isPresented: $showingPaywall) {
                PaywallView()
            }
            .onChange(of: appSessionState.mode) { _, _ in
                sessionStore.resetError()
            }
        }
    }

    private func triggerAuth() {
        // Allow auth even if not pro (check pro status after login)
        Task {
            await appSessionState.authenticate()
        }
    }
    
    private func forceResetPassword() async {
        guard let adminClient = SupabaseClientProvider().adminClient else {
            print("No admin client available")
            return
        }
        
        let email = "aydmaxx@gmail.com"
        let password = "Km7-Temp-2025!"
        
        do {
            print("Attempting to reset password for \(email)...")
            
            // 1. List users to find existing account
            let users = try await adminClient.auth.admin.listUsers()
            
            if let existingUser = users.first(where: { $0.email == email }) {
                print("User found: \(existingUser.id). Updating password...")
                _ = try await adminClient.auth.admin.updateUserById(
                    existingUser.id,
                    attributes: AdminUserAttributes(
                        email: email,
                        password: password,
                        emailConfirm: true
                    )
                )
                print("Password updated successfully.")
            } else {
                print("User not found. Creating new user...")
                _ = try await adminClient.auth.admin.createUser(
                    attributes: AdminUserAttributes(
                        email: email,
                        password: password,
                        emailConfirm: true
                    )
                )
                print("User created successfully.")
            }
            
            // 2. Authenticate with new credentials
            print("Authenticating...")
            // We need to update the state email/password so authenticate() uses them
            DispatchQueue.main.async {
                self.appSessionState.email = email
                self.appSessionState.password = password
                self.appSessionState.mode = .signIn
            }
            
            // Give state a moment to update
            try await Task.sleep(nanoseconds: 500_000_000) // 0.5s
            
            await appSessionState.authenticate()
            
        } catch {
            print("Error resetting password: \(error)")
        }
    }
}
