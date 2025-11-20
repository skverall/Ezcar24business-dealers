import SwiftUI

struct BackupCenterView: View {
    @Environment(\.managedObjectContext) private var context
    @EnvironmentObject private var sessionStore: SessionStore
    @EnvironmentObject private var cloudSyncManager: CloudSyncManager
    @StateObject private var exporter: BackupExportManager

    @State private var month: Date = Date()
    @State private var shareURL: URL?
    @State private var isProcessing = false
    @State private var statusMessage: String?

    init() {
        let ctx = PersistenceController.shared.container.viewContext
        _exporter = StateObject(wrappedValue: BackupExportManager(context: ctx))
    }

    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Create backups locally, share via email, and push a copy to Supabase storage for safekeeping.")
                        .font(.subheadline)
                        .foregroundColor(ColorTheme.secondaryText)
                    if let statusMessage {
                        Text(statusMessage)
                            .font(.footnote)
                            .foregroundColor(ColorTheme.primary)
                    }
                }
                .padding(.vertical, 4)
            }

            Section(header: Text("Exports")) {
                exportButton(title: "Export expenses CSV", systemName: "square.and.arrow.up") {
                    try exporter.exportExpensesCSV()
                }
                exportButton(title: "Export vehicles CSV", systemName: "car") {
                    try exporter.exportVehiclesCSV()
                }
                exportButton(title: "Export clients CSV", systemName: "person.2") {
                    try exporter.exportClientsCSV()
                }
            }

            Section(header: Text("Monthly PDF")) {
                DatePicker("Report month", selection: $month, displayedComponents: [.date])
                    .datePickerStyle(.compact)
                exportButton(title: "Generate PDF summary", systemName: "doc.richtext") {
                    try exporter.generateMonthlyPDF(for: month)
                }
            }

            Section(header: Text("Email-ready archive")) {
                exportButton(title: "Build JSON archive (CSV + PDF)", systemName: "tray.and.arrow.up") {
                    let dealerId = CloudSyncEnvironment.currentDealerId
                    return try await exporter.createMonthlyArchive(for: month, dealerId: dealerId)
                }
                .disabled(isProcessing)
                if sessionStore.isSignedIn {
                    Text("If signed in, the archive also uploads to Supabase (bucket: dealer-backups) for cloud recovery.")
                        .font(.footnote)
                        .foregroundColor(ColorTheme.secondaryText)
                        .padding(.vertical, 4)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Backup & Export")
        .onAppear { attachCloudManagerIfNeeded() }
        .sheet(isPresented: .constant(shareURL != nil), onDismiss: { shareURL = nil }) {
            if let url = shareURL {
                ShareSheet(items: [url]) {
                    shareURL = nil
                }
            }
        }
    }

    private func attachCloudManagerIfNeeded() {
        if exporter.cloudSyncManager == nil {
            exporter.cloudSyncManager = cloudSyncManager
        }
    }

    @ViewBuilder
    private func exportButton(
        title: String,
        systemName: String,
        action: @escaping () throws -> URL
    ) -> some View {
        Button {
            runExport(action)
        } label: {
            HStack {
                Label(title, systemImage: systemName)
                if isProcessing {
                    Spacer()
                    ProgressView()
                }
            }
        }
        .disabled(isProcessing)
    }

    @ViewBuilder
    private func exportButton(
        title: String,
        systemName: String,
        action: @escaping () async throws -> URL
    ) -> some View {
        Button {
            runAsyncExport(action)
        } label: {
            HStack {
                Label(title, systemImage: systemName)
                if isProcessing {
                    Spacer()
                    ProgressView()
                }
            }
        }
        .disabled(isProcessing)
    }

    private func runExport(_ action: @escaping () throws -> URL) {
        isProcessing = true
        statusMessage = nil
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let url = try action()
                DispatchQueue.main.async {
                    shareURL = url
                    statusMessage = "Created \(url.lastPathComponent)"
                    isProcessing = false
                }
            } catch {
                DispatchQueue.main.async {
                    statusMessage = "Failed: \(error.localizedDescription)"
                    cloudSyncManager.showError(statusMessage ?? "Export failed")
                    isProcessing = false
                }
            }
        }
    }

    private func runAsyncExport(_ action: @escaping () async throws -> URL) {
        isProcessing = true
        statusMessage = nil
        Task {
            do {
                let url = try await action()
                await MainActor.run {
                    shareURL = url
                    statusMessage = "Created \(url.lastPathComponent)"
                    isProcessing = false
                }
            } catch {
                await MainActor.run {
                    statusMessage = "Failed: \(error.localizedDescription)"
                    cloudSyncManager.showError(statusMessage ?? "Export failed")
                    isProcessing = false
                }
            }
        }
    }
}

private extension SessionStore {
    var isSignedIn: Bool {
        if case .signedIn = status {
            return true
        }
        return false
    }
}
