//
//  EditAccountView.swift
//  Ezcar24Business
//
//  Created by User on 11/19/25.
//

import SwiftUI

struct EditAccountView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: FinancialAccountsViewModel
    let account: FinancialAccount
    
    @State private var balance: Decimal = 0
    
    init(viewModel: FinancialAccountsViewModel, account: FinancialAccount) {
        self.viewModel = viewModel
        self.account = account
        _balance = State(initialValue: account.balance?.decimalValue ?? 0)
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Account Details") {
                    HStack {
                        Text("Account Type")
                        Spacer()
                        Text(account.accountType?.capitalized ?? "Unknown")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Balance")
                        Spacer()
                        TextField("Amount", value: $balance, format: .currency(code: "USD"))
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                    }
                }
                
                Section {
                    Button("Save Changes") {
                        save()
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundColor(ColorTheme.primary)
                    .bold()
                }
            }
            .navigationTitle("Edit Account")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        save()
                    }
                }
            }
        }
    }
    
    private func save() {
        viewModel.updateBalance(account: account, newBalance: balance)
        dismiss()
    }
}
