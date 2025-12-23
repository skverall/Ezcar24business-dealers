
import Foundation

extension DashboardTimeRange {
    static let dashboardFilters: [DashboardTimeRange] = [.today, .week, .month]

    var displayLabel: String {
        switch self {
        case .today: return "Today"
        case .week: return "Week"
        case .month: return "Month"
        case .all: return "All Time"
        }
    }
}
