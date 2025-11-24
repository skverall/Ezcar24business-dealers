import SwiftUI
import Supabase

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

                    if appSessionState.mode == .signIn {
                        Button("Forgot Password?") {
                            if appSessionState.email.isEmpty {
                                sessionStore.errorMessage = "Please enter your email address to reset password."
                            } else {
                                Task {
                                    do {
                                        try await sessionStore.resetPassword(email: appSessionState.email)
                                        sessionStore.errorMessage = "Password reset email sent! Check your inbox."
                                    } catch {
                                        // Error is already handled in sessionStore but we can ensure it's shown
                                    }
                                }
                            }
                        }
                        .font(.caption)
                        .foregroundColor(.blue)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                        .padding(.top, 4)
                    }
                }

                if let message = sessionStore.errorMessage {
                    Section {
                        Text(message)
                            .font(.footnote)
                            .foregroundStyle(message.contains("sent") ? .green : .red)
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
                
                // Restore Purchases removed as per request

                Section {
                    Button("Continue Offline (Guest Mode)") {
                        // Start a completely clean guest session:
                        // - Wipe ALL local Core Data entities
                        // - Clear offline sync queue so old operations are not replayed
                        // - Reset last sync timestamp so future login will do a full clean sync
                        PersistenceController.shared.deleteAllData()
                        Task {
                            await SyncQueueManager.shared.clear()
                        }
                        UserDefaults.standard.removeObject(forKey: "lastSyncTimestamp")
                        ImageStore.shared.clearAll()
                        isGuest = true
                    }
                    .foregroundColor(.secondary)
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
}
