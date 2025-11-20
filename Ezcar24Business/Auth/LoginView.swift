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
                    Button("Continue Offline (Guest Mode)") {
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
        if !subscriptionManager.isProAccessActive {
            showingPaywall = true
        } else {
            Task {
                await appSessionState.authenticate()
            }
        }
    }
}
