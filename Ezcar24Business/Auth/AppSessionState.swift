import Foundation

@MainActor
final class AppSessionState: ObservableObject {
    enum Mode: Hashable {
        case signIn
        case signUp
    }

    @Published var email: String = "" {
        didSet { recalculateValidation() }
    }

    @Published var password: String = "" {
        didSet { recalculateValidation() }
    }

    @Published var mode: Mode = .signIn
    @Published var isProcessing: Bool = false
    @Published private(set) var isFormValid: Bool = false

    private let sessionStore: SessionStore

    init(sessionStore: SessionStore) {
        self.sessionStore = sessionStore
        recalculateValidation()
    }

    func authenticate() async {
        guard isFormValid else { return }
        isProcessing = true
        defer { isProcessing = false }
        sessionStore.resetError()

        do {
            switch mode {
            case .signIn:
                try await sessionStore.signIn(email: trimmedEmail, password: password)
            case .signUp:
                try await sessionStore.signUp(email: trimmedEmail, password: password)
            }
            clearSensitiveFields()
        } catch {
            // Error already handled in sessionStore
        }
    }

    private func recalculateValidation() {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        isFormValid = !trimmed.isEmpty && password.count >= 6
    }

    private var trimmedEmail: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func clearSensitiveFields() {
        password = ""
    }
}
