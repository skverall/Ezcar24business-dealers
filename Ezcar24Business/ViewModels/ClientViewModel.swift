import Foundation
import CoreData

class ClientViewModel: ObservableObject {
    @Published var clients: [Client] = []
    @Published var searchText: String = ""

    private let context: NSManagedObjectContext

    init(context: NSManagedObjectContext = PersistenceController.shared.container.viewContext) {
        self.context = context
        fetchClients()
    }

    func fetchClients() {
        let request: NSFetchRequest<Client> = Client.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Client.createdAt, ascending: false)]
        do {
            clients = try context.fetch(request)
        } catch {
            print("Failed to fetch clients: \(error)")
            clients = []
        }
    }

    func filteredClients() -> [Client] {
        guard !searchText.isEmpty else { return clients }
        return clients.filter { client in
            let text = searchText.lowercased()
            return (client.name ?? "").lowercased().contains(text) ||
                (client.phone ?? "").lowercased().contains(text) ||
                (client.email ?? "").lowercased().contains(text)
        }
    }

    func addClient(name: String,
                   phone: String?,
                   email: String?,
                   notes: String?,
                   requestDetails: String?,
                   preferredDate: Date?,
                   vehicle: Vehicle?) {
        let client = Client(context: context)
        client.id = UUID()
        client.name = name
        client.phone = phone
        client.email = email
        client.notes = notes
        client.requestDetails = requestDetails
        client.preferredDate = preferredDate
        client.createdAt = Date()
        client.vehicle = vehicle

        save()
    }

    func updateClient(_ client: Client,
                      name: String,
                      phone: String?,
                      email: String?,
                      notes: String?,
                      requestDetails: String?,
                      preferredDate: Date?,
                      vehicle: Vehicle?) {
        client.name = name
        client.phone = phone
        client.email = email
        client.notes = notes
        client.requestDetails = requestDetails
        client.preferredDate = preferredDate
        client.vehicle = vehicle
        save()
    }

    @discardableResult
    func deleteClient(_ client: Client) -> UUID? {
        let id = client.id
        context.delete(client)
        save()
        return id
    }

    private func save() {
        do {
            try context.save()
            fetchClients()
        } catch {
            print("Failed to save client: \(error)")
            context.rollback()
        }
    }
}
