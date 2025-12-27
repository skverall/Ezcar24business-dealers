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

@Database(
    entities = [
        User::class, Vehicle::class, Expense::class, Sale::class, 
        Client::class, ClientInteraction::class, ClientReminder::class,
        FinancialAccount::class, AccountTransaction::class,
        Debt::class, DebtPayment::class, ExpenseTemplate::class,
        SyncQueueItem::class
    ],
    version = 1
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun vehicleDao(): VehicleDao
    abstract fun expenseDao(): ExpenseDao
    abstract fun clientDao(): ClientDao
    abstract fun userDao(): UserDao
    abstract fun financialAccountDao(): FinancialAccountDao
    abstract fun syncQueueDao(): SyncQueueDao
}
