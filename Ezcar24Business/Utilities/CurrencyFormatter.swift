//
//  CurrencyFormatter.swift
//  Ezcar24Business
//
//  UAE Dirham currency formatting utilities
//

import Foundation

struct CurrencyFormatter {
    static let shared = CurrencyFormatter()
    
    private let formatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "AED"
        formatter.currencySymbol = "AED "
        formatter.maximumFractionDigits = 2
        formatter.minimumFractionDigits = 2
        return formatter
    }()
    
    private let compactFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "AED"
        formatter.currencySymbol = "AED "
        formatter.maximumFractionDigits = 0
        formatter.minimumFractionDigits = 0
        return formatter
    }()
    
    func format(_ value: Decimal) -> String {
        return formatter.string(from: NSDecimalNumber(decimal: value)) ?? "AED 0.00"
    }
    
    func formatCompact(_ value: Decimal) -> String {
        return compactFormatter.string(from: NSDecimalNumber(decimal: value)) ?? "AED 0"
    }
}

extension Decimal {
    func asCurrency() -> String {
        return CurrencyFormatter.shared.format(self)
    }
    
    func asCurrencyCompact() -> String {
        return CurrencyFormatter.shared.formatCompact(self)
    }
}

