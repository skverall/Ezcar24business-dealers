//
//  YearFormatter.swift
//  Ezcar24Business
//
//  Year formatting utility
//

import Foundation

struct YearFormatter {
    static let shared = YearFormatter()

    private let formatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .none
        formatter.usesGroupingSeparator = false
        return formatter
    }()

    func format(_ year: Int32) -> String {
        return formatter.string(from: NSNumber(value: year)) ?? ""
    }
}

extension Int32 {
    func asYear() -> String {
        return YearFormatter.shared.format(self)
    }
}
