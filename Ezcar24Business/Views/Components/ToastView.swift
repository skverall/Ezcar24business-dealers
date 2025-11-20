//
//  ToastView.swift
//  Ezcar24Business
//
//  Created by Agent on 20/11/2025.
//

import SwiftUI

struct ToastView: View {
    let message: String
    let isError: Bool
    let onDismiss: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: isError ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                .foregroundColor(isError ? .white : .white)
                .font(.system(size: 20))
            
            Text(message)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .multilineTextAlignment(.leading)
            
            Spacer()
            
            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .foregroundColor(.white.opacity(0.8))
                    .font(.system(size: 14, weight: .bold))
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(isError ? Color.red.opacity(0.95) : Color.green.opacity(0.95))
                .shadow(color: Color.black.opacity(0.15), radius: 10, x: 0, y: 5)
        )
        .padding(.horizontal, 16)
        .transition(.move(edge: .top).combined(with: .opacity))
        .animation(.spring(), value: message)
    }
}

#Preview {
    VStack(spacing: 20) {
        ToastView(message: "Sync failed. Please check your internet connection.", isError: true, onDismiss: {})
        ToastView(message: "Data saved successfully.", isError: false, onDismiss: {})
    }
    .padding()
    .background(Color.gray.opacity(0.1))
}
