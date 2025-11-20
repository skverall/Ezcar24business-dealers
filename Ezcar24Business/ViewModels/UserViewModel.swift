//
//  UserViewModel.swift
//  Ezcar24Business
//
//  ViewModel for user management
//

import Foundation
import CoreData
import Combine

class UserViewModel: ObservableObject {
    @Published var users: [User] = []
    
    private let context: NSManagedObjectContext
    
    init(context: NSManagedObjectContext) {
        self.context = context
        fetchUsers()
    }
    
    func fetchUsers() {
        let request: NSFetchRequest<User> = User.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \User.name, ascending: true)]

        do {
            users = try context.fetch(request)
        } catch {
            print("Error fetching users: \(error)")
        }
    }

    @discardableResult
    func addUser(name: String) -> User {
        let user = User(context: context)
        user.id = UUID()
        user.name = name
        user.createdAt = Date()
        user.updatedAt = Date()

        saveContext()
        fetchUsers()
        return user
    }

    func deleteUser(_ user: User) {
        context.delete(user)
        saveContext()
        fetchUsers()
    }

    func expenseCount(for user: User) -> Int {
        return (user.expenses as? Set<Expense>)?.count ?? 0
    }
    
    func totalExpenses(for user: User) -> Decimal {
        return (user.expenses as? Set<Expense>)?.reduce(0) { $0 + ($1.amount as Decimal? ?? 0) } ?? 0
    }
    
    private func saveContext() {
        do {
            try context.save()
        } catch {
            print("Error saving context: \(error)")
        }
    }
}

