package com.ezcar24.business.data.sync

import android.util.Log
import com.ezcar24.business.data.local.*
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.rpc
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import java.math.BigDecimal
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton
import com.ezcar24.business.util.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@Singleton
class CloudSyncManager @Inject constructor(
    private val client: SupabaseClient,
    private val db: AppDatabase,
    private val syncQueueManager: SyncQueueManager
) {
    private val TAG = "CloudSyncManager"
    
    var isSyncing = false
        private set
    
    // Simplification: In real app, persist this in DataStore
    private var lastSyncTimestamp: Date? = null

    suspend fun syncAfterLogin(dealerId: UUID) = withContext(Dispatchers.IO) {
        if (isSyncing) return@withContext
        isSyncing = true
        Log.d(TAG, "Starting sync for dealer $dealerId")

        try {
            // 1. Process Offline Queue (Push)
            processOfflineQueue(dealerId)

            // 2. Fetch Remote Changes
            val snapshot = fetchRemoteChanges(dealerId, lastSyncTimestamp)
            
            // 3. Merge Changes
            mergeRemoteChanges(snapshot, dealerId)
            
            lastSyncTimestamp = Date()
            Log.d(TAG, "Sync successful")

        } catch (e: Exception) {
            Log.e(TAG, "Sync failed: ${e.message}", e)
        } finally {
            isSyncing = false
        }
    }

    private suspend fun processOfflineQueue(dealerId: UUID) {
        val items = syncQueueManager.getAllItems()
        for (item in items) {
            if (item.dealerId != dealerId) continue
            try {
                val rpcName = getRpcName(item.entityType, item.operation)
                
                // Wrap payload in {"payload": [obj]}
                // We assume payload string is already a valid JSON object string for the entity
                val payloadJson = Json.parseToJsonElement(item.payload)
                val params = mapOf("payload" to listOf(payloadJson))

                client.postgrest.rpc(rpcName, params)
                
                syncQueueManager.remove(item.id)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to process offline item ${item.id}", e)
            }
        }
    }

    private suspend fun fetchRemoteChanges(dealerId: UUID, since: Date?): RemoteSnapshot {
        val sinceStr = since?.let { DateUtils.formatIso8601(it) } ?: "1970-01-01T00:00:00Z"
        
        val params = mapOf(
            "dealer_id" to dealerId.toString(),
            "since" to sinceStr
        )
        
        return client.postgrest.rpc("get_changes", params).decodeAs<RemoteSnapshot>()
    }
    
    private suspend fun mergeRemoteChanges(snapshot: RemoteSnapshot, dealerId: UUID) {
        // We do this serially or in parallel blocks, but writing to DB should be transactional.
        // Room runsSuspend in transaction automatically for @Transaction methods, but here we explicitly use runInTransaction
        db.runInTransaction {
            // 1. Users
            mergeUsers(snapshot.users)
            
            // 2. Accounts
            mergeAccounts(snapshot.accounts)
            
            // 3. Vehicles
            mergeVehicles(snapshot.vehicles)
            
            // 4. Clients
            mergeClients(snapshot.clients)
            
            // 5. Templates
            mergeTemplates(snapshot.templates)
            
            // 6. Expenses
            mergeExpenses(snapshot.expenses)
            
            // 7. Sales
            mergeSales(snapshot.sales)
            
            // 8. Debts
            mergeDebts(snapshot.debts)
            
            // 9. Debt Payments
            mergeDebtPayments(snapshot.debtPayments)
            
            // 10. Account Transactions
            mergeAccountTransactions(snapshot.accountTransactions)
        }
    }

    // --- Merge Helpers ---

    private fun mergeUsers(remoteUsers: List<RemoteDealerUser>) {
        // Fetch existing logic omitted for brevity, assuming upsert with LWW check
        // In highly optimized apps, we fetch logic by IDs. Here we might do one-by-one or batch.
        // Since Room DAOs are suspend, we can't call them easily inside runInTransaction (which is blocking) 
        // unless we use the blocking DAO methods or run runInTransaction in a coroutine properly.
        // Room's runInTransaction matches the thread.
        // For simplicity, we'll iterate and use Dao.
        
        // Note: We need blocking DAOs or runBlocking inside transaction if DAOs are suspend. 
        // Best practice: The whole merge block should be suspend, but Room transaction is blocking.
        // We will assume we are adding blocking methods to DAOs or just mapping here and using upsertAll.
        // Actually, LWW requires checking existing.
        
        // I will use runBlocking for the transaction block for this artifact to ensure correctness with suspend DAOs 
        // or just use accessing DB directly if I had the implementation. 
        // Let's implement logic assuming we can call suspend functions or using a helper 'safe transaction'
        
        // A better pattern for Room + Coroutines is to do the reads, then writes, or use withTransaction.
        // But let's write the logic first.
        
        // For this port, I will implement one loop per entity type.
        
        // Note: To implement LWW properly, we need to know the state of the local DB.
        // Implementing 'upsertIfNewer' logic.
        
        remoteUsers.forEach { remote ->
            val id = UUID.fromString(remote.id)
            val existing = kotlinx.coroutines.runBlocking { db.userDao().getById(id) }
            
            if (remote.deletedAt != null) {
                if (existing != null) kotlinx.coroutines.runBlocking { db.userDao().delete(existing) }
                return@forEach
            }
            
            val remoteUpdated = DateUtils.parseIso8601(remote.updatedAt) ?: Date()
            if (existing != null && existing.updatedAt >= remoteUpdated) {
                return@forEach // Local is newer
            }
            
            val newUser = User(
                id = id,
                name = remote.name,
                createdAt = DateUtils.parseIso8601(remote.createdAt) ?: Date(),
                updatedAt = remoteUpdated,
                deletedAt = null 
            )
            kotlinx.coroutines.runBlocking { db.userDao().upsert(newUser) }
        }
    }

    private fun mergeVehicles(remoteVehicles: List<RemoteVehicle>) {
        remoteVehicles.forEach { remote ->
            val id = UUID.fromString(remote.id)
            val existing = kotlinx.coroutines.runBlocking { db.vehicleDao().getById(id) }
            
            if (remote.deletedAt != null) {
                if (existing != null) kotlinx.coroutines.runBlocking { db.vehicleDao().delete(existing) }
                return@forEach
            }
            
            val remoteUpdated = DateUtils.parseIso8601(remote.updatedAt) ?: Date()
            if (existing != null && (existing.updatedAt ?: Date(0)) >= remoteUpdated) {
                return@forEach
            }
            
            val newVehicle = Vehicle(
                id = id,
                vin = remote.vin,
                make = remote.make,
                model = remote.model,
                year = remote.year,
                purchasePrice = remote.purchasePrice,
                purchaseDate = DateUtils.parseDateOnly(remote.purchaseDate) ?: Date(),
                status = remote.status,
                notes = remote.notes,
                createdAt = DateUtils.parseIso8601(remote.createdAt) ?: Date(),
                updatedAt = remoteUpdated,
                deletedAt = null,
                salePrice = remote.salePrice,
                saleDate = remote.saleDate?.let { DateUtils.parseDateOnly(it) },
                askingPrice = remote.askingPrice,
                reportURL = remote.reportUrl,
                buyerName = null, // Not in RemoteVehicle? Check Swift
                buyerPhone = null,
                paymentMethod = null
            )
            // Swift has partial update or mapping logic. RemoteVehicle struct includes sale info? 
            // RemoteVehicle in Swift has salePrice, saleDate. 
            // It does NOT have buyerName etc in RemoteVehicle struct? 
            // Checking Swift: RemoteVehicle has salePrice, saleDate. RemoteSale has buyer info. 
            // The local Vehicle entity has buyerName. We must preserve it if we update from RemoteVehicle?
            // Or does RemoteVehicle logic overwrite? Swift: "obj.salePrice = ... obj.saleDate = ..."
            // It doesn't seem to touch buyerName in mergeVehicles.
            
            // If existing, we should probably keep fields not in RemoteVehicle (like buyerName) unless implied.
            // But if we replace object, we lose them. 
            // Better to copy from existing if they are not in valid remote.
            
            val finalVehicle = if (existing != null) {
                newVehicle.copy(
                    buyerName = existing.buyerName,
                    buyerPhone = existing.buyerPhone,
                    paymentMethod = existing.paymentMethod
                )
            } else {
                newVehicle
            }
            
            kotlinx.coroutines.runBlocking { db.vehicleDao().upsert(finalVehicle) }
        }
    }

    private fun mergeAccounts(remoteAccounts: List<RemoteFinancialAccount>) {
        remoteAccounts.forEach { remote ->
            val id = UUID.fromString(remote.id)
            val existing = kotlinx.coroutines.runBlocking { db.financialAccountDao().getById(id) }
            
            if (remote.deletedAt != null) {
                if (existing != null) kotlinx.coroutines.runBlocking { db.financialAccountDao().delete(existing) }
                return@forEach
            }
            
            val remoteUpdated = DateUtils.parseIso8601(remote.updatedAt) ?: Date()
            if (existing != null && existing.updatedAt >= remoteUpdated) return@forEach
            
            val newAccount = FinancialAccount(
                id = id,
                accountType = remote.accountType,
                balance = remote.balance,
                updatedAt = remoteUpdated,
                deletedAt = null
            )
            kotlinx.coroutines.runBlocking { db.financialAccountDao().upsert(newAccount) }
        }
    }
    
    private fun mergeExpenses(remoteExpenses: List<RemoteExpense>) {
        remoteExpenses.forEach { remote ->
            val id = UUID.fromString(remote.id)
            val existing = kotlinx.coroutines.runBlocking { db.expenseDao().getById(id) }
            
            if (remote.deletedAt != null) {
                if (existing != null) kotlinx.coroutines.runBlocking { db.expenseDao().delete(existing) }
                return@forEach
            }
            val remoteUpdated = DateUtils.parseIso8601(remote.updatedAt) ?: Date()
            if (existing != null && (existing.updatedAt ?: Date(0)) >= remoteUpdated) return@forEach
            
            val newExpense = Expense(
                id = id,
                amount = remote.amount,
                date = DateUtils.parseDateOnly(remote.date) ?: Date(),
                expenseDescription = remote.expenseDescription,
                category = remote.category,
                createdAt = DateUtils.parseIso8601(remote.createdAt) ?: Date(),
                updatedAt = remoteUpdated,
                deletedAt = null,
                vehicleId = remote.vehicleId?.toUUID(),
                userId = remote.userId?.toUUID(),
                accountId = remote.accountId?.toUUID()
            )
            kotlinx.coroutines.runBlocking { db.expenseDao().upsert(newExpense) }
        }
    }

    private fun mergeClients(remoteClients: List<RemoteClient>) {
        remoteClients.forEach { remote ->
            val id = UUID.fromString(remote.id)
            val existing = kotlinx.coroutines.runBlocking { db.clientDao().getById(id) }
            
             if (remote.deletedAt != null) {
                if (existing != null) kotlinx.coroutines.runBlocking { db.clientDao().delete(existing) }
                return@forEach
            }
            val remoteUpdated = DateUtils.parseIso8601(remote.updatedAt) ?: Date()
            if (existing != null && (existing.updatedAt ?: Date(0)) >= remoteUpdated) return@forEach
            
            val newClient = Client(
                id = id,
                name = remote.name,
                phone = remote.phone,
                email = remote.email,
                notes = remote.notes,
                requestDetails = remote.requestDetails,
                preferredDate = remote.preferredDate?.let { DateUtils.parseIso8601(it) }, // Is preferredDate ISO or DateOnly? Swift uses implicit Date?
                status = remote.status,
                createdAt = DateUtils.parseIso8601(remote.createdAt) ?: Date(),
                updatedAt = remoteUpdated,
                deletedAt = null,
                vehicleId = remote.vehicleId?.toUUID()
            )
            kotlinx.coroutines.runBlocking { db.clientDao().upsert(newClient) }
        }
    }
    
    // Simplification: Omitting other entities (Sales, etc.) code for brevity in this artifact, but logic is identical.
    // In production, MUST implement all: Sales, Debts, Payments, Transactions, Templates.
    
    private fun mergeSales(remoteSales: List<RemoteSale>) {
        remoteSales.forEach { remote ->
            val id = UUID.fromString(remote.id)
            val existing = kotlinx.coroutines.runBlocking { db.saleDao().getById(id) }

            if (remote.deletedAt != null) {
                if (existing != null) kotlinx.coroutines.runBlocking { db.saleDao().delete(existing) }
                return@forEach
            }

            val remoteUpdated = DateUtils.parseIso8601(remote.updatedAt) ?: Date()
            if (existing != null && (existing.updatedAt ?: Date(0)) >= remoteUpdated) return@forEach

            val newSale = Sale(
                id = id,
                amount = remote.amount,
                date = DateUtils.parseIso8601(remote.date) ?: Date(),
                vehicleId = UUID.fromString(remote.vehicleId),
                // salePrice = remote.salePrice?.toBigDecimalOrNull(), // Removed as not in Entity
                // profit = remote.profit?.toBigDecimalOrNull(), // Removed as not in Entity
                buyerName = remote.buyerName,
                buyerPhone = remote.buyerPhone,
                paymentMethod = remote.paymentMethod,
                accountId = remote.accountId?.toUUID(),
                // notes = remote.notes, // Removed as not in Entity
                createdAt = DateUtils.parseIso8601(remote.createdAt) ?: Date(),
                updatedAt = remoteUpdated,
                deletedAt = null
            )
            kotlinx.coroutines.runBlocking { db.saleDao().upsert(newSale) }
        }
    }

    private fun mergeDebts(remoteDebts: List<RemoteDebt>) {
        remoteDebts.forEach { remote ->
            val id = UUID.fromString(remote.id)
            val existing = kotlinx.coroutines.runBlocking { db.debtDao().getById(id) }

            if (remote.deletedAt != null) {
                if (existing != null) kotlinx.coroutines.runBlocking { db.debtDao().delete(existing) }
                return@forEach
            }
            val remoteUpdated = DateUtils.parseIso8601(remote.updatedAt) ?: Date()
            if (existing != null && (existing.updatedAt ?: Date(0)) >= remoteUpdated) return@forEach

            val newDebt = Debt(
                id = id,
                counterpartyName = remote.counterpartyName,
                counterpartyPhone = remote.counterpartyPhone,
                direction = remote.direction,
                amount = remote.amount,
                notes = remote.notes,
                dueDate = remote.dueDate?.let { DateUtils.parseDateOnly(it) }, // Due date is usually YYYY-MM-DD
                createdAt = DateUtils.parseIso8601(remote.createdAt) ?: Date(),
                updatedAt = remoteUpdated,
                deletedAt = null
            )
            kotlinx.coroutines.runBlocking { db.debtDao().upsert(newDebt) }
        }
    }

    private fun mergeDebtPayments(remotePayments: List<RemoteDebtPayment>) {
        remotePayments.forEach { remote ->
            val id = UUID.fromString(remote.id)
            val existing = kotlinx.coroutines.runBlocking { db.debtPaymentDao().getById(id) }

            if (remote.deletedAt != null) {
                if (existing != null) kotlinx.coroutines.runBlocking { db.debtPaymentDao().delete(existing) }
                return@forEach
            }
            val remoteUpdated = DateUtils.parseIso8601(remote.updatedAt) ?: Date()
            if (existing != null && (existing.updatedAt ?: Date(0)) >= remoteUpdated) return@forEach

            val newPayment = DebtPayment(
                id = id,
                debtId = UUID.fromString(remote.debtId),
                amount = remote.amount,
                date = DateUtils.parseIso8601(remote.date) ?: Date(), 
                note = remote.note,
                paymentMethod = remote.paymentMethod,
                accountId = remote.accountId?.toUUID(),
                createdAt = DateUtils.parseIso8601(remote.createdAt) ?: Date(),
                updatedAt = remoteUpdated,
                deletedAt = null
            )
            kotlinx.coroutines.runBlocking { db.debtPaymentDao().upsert(newPayment) }
        }
    }

    private fun mergeAccountTransactions(remoteTxs: List<RemoteAccountTransaction>) {
        remoteTxs.forEach { remote ->
            val id = UUID.fromString(remote.id)
            val existing = kotlinx.coroutines.runBlocking { db.accountTransactionDao().getById(id) }

            if (remote.deletedAt != null) {
                if (existing != null) kotlinx.coroutines.runBlocking { db.accountTransactionDao().delete(existing) }
                return@forEach
            }
            val remoteUpdated = DateUtils.parseIso8601(remote.updatedAt) ?: Date()
            if (existing != null && (existing.updatedAt ?: Date(0)) >= remoteUpdated) return@forEach

            val newTx = AccountTransaction(
                id = id,
                accountId = UUID.fromString(remote.accountId),
                transactionType = remote.transactionType,
                amount = remote.amount,
                date = DateUtils.parseIso8601(remote.date) ?: Date(),
                note = remote.note,
                createdAt = DateUtils.parseIso8601(remote.createdAt) ?: Date(),
                updatedAt = remoteUpdated,
                deletedAt = null
            )
            kotlinx.coroutines.runBlocking { db.accountTransactionDao().upsert(newTx) }
        }
    }

    private fun mergeTemplates(remoteTemplates: List<RemoteExpenseTemplate>) {
        remoteTemplates.forEach { remote ->
            val id = UUID.fromString(remote.id)
            val existing = kotlinx.coroutines.runBlocking { db.expenseTemplateDao().getById(id) }

            if (remote.deletedAt != null) {
                if (existing != null) kotlinx.coroutines.runBlocking { db.expenseTemplateDao().delete(existing) }
                return@forEach
            }
            val remoteUpdated = DateUtils.parseIso8601(remote.updatedAt) ?: Date()
            if (existing != null && (existing.updatedAt ?: Date(0)) >= remoteUpdated) return@forEach

            val newTemplate = ExpenseTemplate(
                id = id,
                name = remote.name,
                category = remote.category,
                defaultDescription = remote.defaultDescription,
                defaultAmount = remote.defaultAmount,
                updatedAt = remoteUpdated,
                deletedAt = null,
                vehicleId = null, // Set default null as these are general templates
                userId = null,
                accountId = null
            )
            kotlinx.coroutines.runBlocking { db.expenseTemplateDao().upsert(newTemplate) }
        }
    }

    
    private fun getRpcName(entityType: String, operation: String): String {
        return if (operation == "delete") {
             when(entityType) {
                "vehicle" -> "delete_crm_vehicles"
                "expense" -> "delete_crm_expenses"
                "sale" -> "delete_crm_sales"
                "client" -> "delete_crm_dealer_clients"
                "debt" -> "delete_crm_debts"
                "debtPayment" -> "delete_crm_debt_payments"
                "accountTransaction" -> "delete_crm_account_transactions"
                "user" -> "delete_users" // verify rpc name
                else -> "delete_${entityType}s"
             }
        } else {
             when(entityType) {
                "client" -> "sync_clients"
                "debtPayment" -> "sync_debt_payments"
                "accountTransaction" -> "sync_account_transactions"
                else -> "sync_${entityType}s"
             }
        }
    }


    // --- Public API for ViewModels ---
    // These methods handle local upsert + queueing sync items

    private fun getCurrentDealerId(): UUID = CloudSyncEnvironment.currentDealerId 
        ?: throw IllegalStateException("Dealer ID not set")

    suspend fun upsertClient(client: Client) {
        db.clientDao().upsert(client)
        val dealerId = getCurrentDealerId()
        syncQueueManager.enqueue(SyncQueueItem(
            id = UUID.randomUUID(),
            entityType = "client",
            operation = "upsert",
            payload = Json.encodeToString(RemoteClient.serializer(), client.toRemote(dealerId.toString())),
            dealerId = dealerId,
            createdAt = Date()
        ))
    }

    suspend fun deleteClient(client: Client) {
        val deleted = client.copy(deletedAt = Date(), updatedAt = Date())
        db.clientDao().upsert(deleted)
        val dealerId = getCurrentDealerId()
        syncQueueManager.enqueue(SyncQueueItem(
            id = UUID.randomUUID(),
            entityType = "client",
            operation = "delete",
            payload = Json.encodeToString(RemoteClient.serializer(), deleted.toRemote(dealerId.toString())),
            dealerId = dealerId,
            createdAt = Date()
        ))
    }

    suspend fun upsertSale(sale: Sale) {
        db.saleDao().upsert(sale)
        val dealerId = getCurrentDealerId()
        syncQueueManager.enqueue(SyncQueueItem(
            id = UUID.randomUUID(),
            entityType = "sale",
            operation = "upsert",
            payload = Json.encodeToString(RemoteSale.serializer(), sale.toRemote(dealerId.toString())),
            dealerId = dealerId,
            createdAt = Date()
        ))
    }
    
    suspend fun deleteSale(sale: Sale) {
        val deleted = sale.copy(deletedAt = Date(), updatedAt = Date())
        db.saleDao().upsert(deleted)
        val dealerId = getCurrentDealerId()
        syncQueueManager.enqueue(SyncQueueItem(
            id = UUID.randomUUID(),
            entityType = "sale",
            operation = "delete",
            payload = Json.encodeToString(RemoteSale.serializer(), deleted.toRemote(dealerId.toString())),
            dealerId = dealerId,
            createdAt = Date()
        ))
    }

    suspend fun upsertVehicle(vehicle: Vehicle) {
        db.vehicleDao().upsert(vehicle)
        val dealerId = getCurrentDealerId()
        syncQueueManager.enqueue(SyncQueueItem(
            id = UUID.randomUUID(),
            entityType = "vehicle",
            operation = "upsert",
            payload = Json.encodeToString(RemoteVehicle.serializer(), vehicle.toRemote(dealerId.toString())),
            dealerId = dealerId,
            createdAt = Date()
        ))
    }

    suspend fun upsertFinancialAccount(account: FinancialAccount) {
        db.financialAccountDao().upsert(account)
        val dealerId = getCurrentDealerId()
        syncQueueManager.enqueue(SyncQueueItem(
            id = UUID.randomUUID(),
            entityType = "financialAccount",
            operation = "upsert",
            payload = Json.encodeToString(RemoteFinancialAccount.serializer(), account.toRemote(dealerId.toString())),
            dealerId = dealerId,
            createdAt = Date()
        ))
    }
    
    suspend fun upsertExpense(expense: Expense) {
        db.expenseDao().upsert(expense)
        val dealerId = getCurrentDealerId()
        syncQueueManager.enqueue(SyncQueueItem(
            id = UUID.randomUUID(),
            entityType = "expense",
            operation = "upsert",
            payload = Json.encodeToString(RemoteExpense.serializer(), expense.toRemote(dealerId.toString())),
            dealerId = dealerId,
            createdAt = Date()
        ))
    }

    suspend fun deleteExpense(expense: Expense) {
        val deleted = expense.copy(deletedAt = Date(), updatedAt = Date())
        db.expenseDao().upsert(deleted)
        val dealerId = getCurrentDealerId()
        syncQueueManager.enqueue(SyncQueueItem(
            id = UUID.randomUUID(),
            entityType = "expense",
            operation = "delete",
            payload = Json.encodeToString(RemoteExpense.serializer(), deleted.toRemote(dealerId.toString())),
            dealerId = dealerId,
            createdAt = Date()
        ))
    }
}



// Extension functions to map local Entities to Remote DTOs (Needed for Queue payload)
fun Client.toRemote(dealerId: String) = RemoteClient(
    id = id.toString(),
    dealerId = dealerId,
    name = name,
    phone = phone,
    email = email,
    notes = notes,
    requestDetails = requestDetails,
    preferredDate = preferredDate?.let { DateUtils.formatIso8601(it) },
    status = status ?: "new",
    vehicleId = vehicleId?.toString(),
    createdAt = DateUtils.formatIso8601(createdAt),
    updatedAt = updatedAt?.let { DateUtils.formatIso8601(it) } ?: DateUtils.formatIso8601(createdAt),
    deletedAt = deletedAt?.let { DateUtils.formatIso8601(it) }
)

fun Sale.toRemote(dealerId: String) = RemoteSale(
    id = id.toString(),
    dealerId = dealerId,
    vehicleId = vehicleId?.toString() ?: "",
    amount = amount ?: BigDecimal.ZERO,
    date = date?.let { DateUtils.formatIso8601(it) } ?: "",
    buyerName = buyerName,
    buyerPhone = buyerPhone,
    paymentMethod = paymentMethod,
    accountId = accountId?.toString(),
    createdAt = createdAt?.let { DateUtils.formatIso8601(it) } ?: "",
    updatedAt = updatedAt?.let { DateUtils.formatIso8601(it) } ?: "",
    deletedAt = deletedAt?.let { DateUtils.formatIso8601(it) }
)

fun Vehicle.toRemote(dealerId: String) = RemoteVehicle(
    id = id.toString(),
    dealerId = dealerId,
    vin = vin,
    make = make,
    model = model,
    year = year,
    purchasePrice = purchasePrice,
    purchaseDate = DateUtils.formatDateOnly(purchaseDate),
    status = status,
    notes = notes,
    createdAt = DateUtils.formatIso8601(createdAt),
    updatedAt = updatedAt?.let { DateUtils.formatIso8601(it) } ?: DateUtils.formatIso8601(createdAt),
    deletedAt = deletedAt?.let { DateUtils.formatIso8601(it) },
    salePrice = salePrice,
    saleDate = saleDate?.let { DateUtils.formatDateOnly(it) },
    askingPrice = askingPrice,
    reportUrl = reportURL
)

fun FinancialAccount.toRemote(dealerId: String) = RemoteFinancialAccount(
    id = id.toString(),
    dealerId = dealerId,
    accountType = accountType,
    balance = balance,
    updatedAt = DateUtils.formatIso8601(updatedAt),
    deletedAt = deletedAt?.let { DateUtils.formatIso8601(it) }
)

fun Expense.toRemote(dealerId: String) = RemoteExpense(
    id = id.toString(),
    dealerId = dealerId,
    amount = amount,
    date = DateUtils.formatDateOnly(date),
    expenseDescription = expenseDescription,
    category = category,
    vehicleId = vehicleId?.toString(),
    userId = userId?.toString(),
    accountId = accountId?.toString(),
    createdAt = DateUtils.formatIso8601(createdAt),
    updatedAt = updatedAt?.let { DateUtils.formatIso8601(it) } ?: DateUtils.formatIso8601(createdAt),
    deletedAt = deletedAt?.let { DateUtils.formatIso8601(it) }
)

