import SwiftUI

struct PasswordResetView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @Environment(\.dismiss) private var dismiss
    
    @State private var newPassword: String = ""
    @State private var confirmPassword: String = ""
    @State private var isProcessing = false
    @State private var showSuccess = false
    @FocusState private var focusedField: Field?
    
    private enum Field {
        case newPassword
        case confirmPassword
    }
    
    private var isValid: Bool {
        !newPassword.isEmpty && 
        newPassword.count >= 6 && 
        newPassword == confirmPassword
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                // Header
                VStack(spacing: 12) {
                    Image(systemName: "lock.rotation")
                        .font(.system(size: 60))
                        .foregroundColor(.blue)
                    
                    Text("Reset Password")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Enter your new password")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding(.top, 40)
                
                // Password fields
                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("New Password")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        SecureField("At least 6 characters", text: $newPassword)
                            .textContentType(.newPassword)
                            .focused($focusedField, equals: .newPassword)
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(10)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Confirm Password")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        
                        SecureField("Re-enter password", text: $confirmPassword)
                            .textContentType(.newPassword)
                            .focused($focusedField, equals: .confirmPassword)
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(10)
                        
                        if !confirmPassword.isEmpty && newPassword != confirmPassword {
                            Text("Passwords do not match")
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                }
                .padding(.horizontal)
                
                // Update button
                Button(action: updatePassword) {
                    HStack {
                        if isProcessing {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                        }
                        Text(isProcessing ? "Updating..." : "Update Password")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isValid ? Color.blue : Color.gray)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                .disabled(!isValid || isProcessing)
                .padding(.horizontal)
                
                if let errorMessage = sessionStore.errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundColor(.red)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                
                Spacer()
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        sessionStore.showPasswordReset = false
                    }
                }
                
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Done") {
                        focusedField = nil
                    }
                }
            }
            .alert("Password Updated", isPresented: $showSuccess) {
                Button("OK") {
                    sessionStore.showPasswordReset = false
                }
            } message: {
                Text("Your password has been successfully updated. You are now logged in.")
            }
        }
    }
    
    private func updatePassword() {
        guard isValid else { return }
        
        isProcessing = true
        
        Task {
            do {
                try await sessionStore.updatePassword(newPassword)
                await MainActor.run {
                    isProcessing = false
                    showSuccess = true
                }
            } catch {
                await MainActor.run {
                    isProcessing = false
                    // Error is already set in sessionStore
                }
            }
        }
    }
}
