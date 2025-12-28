package com.ezcar24.business.data.local

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.room.Update
import java.util.UUID
import java.util.Date

@Dao
interface BaseDao<T> {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(entity: T)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(entities: List<T>)

    @Delete
    suspend fun delete(entity: T)
}

@Dao
interface VehicleDao : BaseDao<Vehicle> {
    @Query("SELECT * FROM vehicles WHERE deletedAt IS NULL ORDER BY createdAt DESC")
    suspend fun getAllActive(): List<Vehicle>

    @Query("SELECT * FROM vehicles WHERE id = :id")
    suspend fun getById(id: UUID): Vehicle?

    @Query("SELECT COUNT(*) FROM vehicles WHERE deletedAt IS NULL")
    suspend fun count(): Int
}

@Dao
interface ExpenseDao : BaseDao<Expense> {
    @Query("SELECT * FROM expenses WHERE vehicleId = :vehicleId AND deletedAt IS NULL ORDER BY date DESC")
    suspend fun getByVehicleId(vehicleId: UUID): List<Expense>
    
    @Query("SELECT * FROM expenses WHERE id = :id")
    suspend fun getById(id: UUID): Expense?

    @Query("SELECT * FROM expenses WHERE deletedAt IS NULL ORDER BY date DESC")
    suspend fun getAll(): List<Expense>

    @Query("SELECT * FROM expenses WHERE date >= :since AND deletedAt IS NULL ORDER BY date DESC")
    suspend fun getExpensesSince(since: Date): List<Expense>
}

@Dao
interface ClientDao : BaseDao<Client> {
    @Query("SELECT * FROM clients WHERE deletedAt IS NULL ORDER BY createdAt DESC")
    suspend fun getAllActive(): List<Client>
    
    @Query("SELECT * FROM clients WHERE id = :id")
    suspend fun getById(id: UUID): Client?
}

@Dao
interface UserDao : BaseDao<User> {
    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getById(id: UUID): User?

    @Query("SELECT * FROM users WHERE deletedAt IS NULL ORDER BY name ASC")
    suspend fun getAllActive(): List<User>
}

@Dao
interface FinancialAccountDao : BaseDao<FinancialAccount> {
    @Query("SELECT * FROM financial_accounts WHERE deletedAt IS NULL")
    suspend fun getAll(): List<FinancialAccount>
    
    @Query("SELECT * FROM financial_accounts WHERE id = :id")
    suspend fun getById(id: UUID): FinancialAccount?
}

@Dao
interface SyncQueueDao : BaseDao<SyncQueueItem> {
    @Query("SELECT * FROM sync_queue ORDER BY createdAt ASC")
    suspend fun getAll(): List<SyncQueueItem>

    @Query("DELETE FROM sync_queue WHERE id = :id")
    suspend fun deleteById(id: UUID)
}

@Dao
interface SaleDao : BaseDao<Sale> {
    @Query("SELECT * FROM sales WHERE id = :id")
    suspend fun getById(id: UUID): Sale?

    @Query("SELECT * FROM sales WHERE deletedAt IS NULL")
    suspend fun getAll(): List<Sale>
}

@Dao
interface DebtDao : BaseDao<Debt> {
    @Query("SELECT * FROM debts WHERE id = :id")
    suspend fun getById(id: UUID): Debt?
}

@Dao
interface DebtPaymentDao : BaseDao<DebtPayment> {
    @Query("SELECT * FROM debt_payments WHERE id = :id")
    suspend fun getById(id: UUID): DebtPayment?
}

@Dao
interface AccountTransactionDao : BaseDao<AccountTransaction> {
    @Query("SELECT * FROM account_transactions WHERE id = :id")
    suspend fun getById(id: UUID): AccountTransaction?
}

@Dao
interface ExpenseTemplateDao : BaseDao<ExpenseTemplate> {
    @Query("SELECT * FROM expense_templates WHERE id = :id")
    suspend fun getById(id: UUID): ExpenseTemplate?
}

@Dao
interface ClientInteractionDao : BaseDao<ClientInteraction> {
    @Query("SELECT * FROM client_interactions WHERE clientId = :clientId ORDER BY occurredAt DESC")
    suspend fun getByClient(clientId: UUID): List<ClientInteraction>

    @Query("DELETE FROM client_interactions WHERE clientId = :clientId")
    suspend fun deleteByClient(clientId: UUID)
}

@Dao
interface ClientReminderDao : BaseDao<ClientReminder> {
    @Query("SELECT * FROM client_reminders WHERE clientId = :clientId ORDER BY dueDate ASC")
    suspend fun getByClient(clientId: UUID): List<ClientReminder>

    @Query("DELETE FROM client_reminders WHERE clientId = :clientId")
    suspend fun deleteByClient(clientId: UUID)
}

@Database(
    entities = [
        User::class, Vehicle::class, Expense::class, Sale::class, 
        Client::class, ClientInteraction::class, ClientReminder::class,
        FinancialAccount::class, AccountTransaction::class,
        Debt::class, DebtPayment::class, ExpenseTemplate::class,
        SyncQueueItem::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun vehicleDao(): VehicleDao
    abstract fun expenseDao(): ExpenseDao
    abstract fun clientDao(): ClientDao
    abstract fun userDao(): UserDao
    abstract fun financialAccountDao(): FinancialAccountDao
    abstract fun syncQueueDao(): SyncQueueDao
    abstract fun saleDao(): SaleDao
    abstract fun debtDao(): DebtDao
    abstract fun debtPaymentDao(): DebtPaymentDao
    abstract fun accountTransactionDao(): AccountTransactionDao
    abstract fun expenseTemplateDao(): ExpenseTemplateDao
    abstract fun clientInteractionDao(): ClientInteractionDao
    abstract fun clientReminderDao(): ClientReminderDao
}
