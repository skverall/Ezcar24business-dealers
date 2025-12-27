package com.ezcar24.business.data.sync

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.math.BigDecimal
// Using cleanup for imports

// Custom Serializer for Date/UUID might be needed if standard ones fail, 
// but Supabase-kt handles UUID and Instant usually. 
// For simplicity in this plan, accessing strings/primitives directly where possible.

@Serializable
data class RemoteDealerUser(
    val id: String,
    @SerialName("dealer_id") val dealerId: String,
    val name: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("deleted_at") val deletedAt: String? = null
)

@Serializable
data class RemoteFinancialAccount(
    val id: String,
    @SerialName("dealer_id") val dealerId: String,
    @SerialName("account_type") val accountType: String,
    val balance: String, // Decimal in JSON is string or number? Usually number but BigDecimal best safe as String if possible. iOS uses Decimal (which decodes from number). kotlinx serialization needs contextual or string.
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("deleted_at") val deletedAt: String? = null
)

@Serializable
data class RemoteVehicle(
    val id: String,
    @SerialName("dealer_id") val dealerId: String,
    val vin: String,
    val make: String? = null,
    val model: String? = null,
    val year: Int? = null,
    @SerialName("purchase_price") val purchasePrice: String,
    @SerialName("purchase_date") val purchaseDate: String, // String in Swift struct
    val status: String,
    val notes: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("sale_price") val salePrice: String? = null,
    @SerialName("sale_date") val saleDate: String? = null,
    @SerialName("photo_url") val photoUrl: String? = null,
    @SerialName("asking_price") val askingPrice: String? = null,
    @SerialName("report_url") val reportUrl: String? = null,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("deleted_at") val deletedAt: String? = null
)

@Serializable
data class RemoteExpense(
    val id: String,
    @SerialName("dealer_id") val dealerId: String,
    val amount: String,
    val date: String,
    @SerialName("description") val expenseDescription: String? = null,
    val category: String,
    @SerialName("created_at") val createdAt: String,
    @SerialName("vehicle_id") val vehicleId: String? = null,
    @SerialName("user_id") val userId: String? = null,
    @SerialName("account_id") val accountId: String? = null,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("deleted_at") val deletedAt: String? = null
)

@Serializable
data class RemoteSale(
    val id: String,
    @SerialName("dealer_id") val dealerId: String,
    @SerialName("vehicle_id") val vehicleId: String,
    val amount: String, // Decimal
    @SerialName("sale_price") val salePrice: String? = null,
    val profit: String? = null,
    val date: String,
    @SerialName("buyer_name") val buyerName: String? = null,
    @SerialName("buyer_phone") val buyerPhone: String? = null,
    @SerialName("payment_method") val paymentMethod: String? = null,
    @SerialName("account_id") val accountId: String? = null,
    val notes: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("deleted_at") val deletedAt: String? = null
)

@Serializable
data class RemoteClient(
    val id: String,
    @SerialName("dealer_id") val dealerId: String,
    val name: String,
    val phone: String? = null,
    val email: String? = null,
    val notes: String? = null,
    @SerialName("request_details") val requestDetails: String? = null,
    @SerialName("preferred_date") val preferredDate: String? = null,
    @SerialName("created_at") val createdAt: String,
    val status: String,
    @SerialName("vehicle_id") val vehicleId: String? = null,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("deleted_at") val deletedAt: String? = null
)

// Add others: RemoteDebt, RemoteDebtPayment, RemoteAccountTransaction, RemoteExpenseTemplate if needed. 
// For brevity, added main ones. User asked for exact copy but I can add incrementally.
// Adding remaining...

@Serializable
data class RemoteDebt(
    val id: String,
    @SerialName("dealer_id") val dealerId: String,
    @SerialName("counterparty_name") val counterpartyName: String,
    @SerialName("counterparty_phone") val counterpartyPhone: String? = null,
    val direction: String,
    val amount: String,
    val notes: String? = null,
    @SerialName("due_date") val dueDate: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("deleted_at") val deletedAt: String? = null
)

@Serializable
data class RemoteDebtPayment(
    val id: String,
    @SerialName("dealer_id") val dealerId: String,
    @SerialName("debt_id") val debtId: String,
    val amount: String,
    val date: String,
    val note: String? = null,
    @SerialName("payment_method") val paymentMethod: String? = null,
    @SerialName("account_id") val accountId: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("deleted_at") val deletedAt: String? = null
)

@Serializable
data class RemoteAccountTransaction(
    val id: String,
    @SerialName("dealer_id") val dealerId: String,
    @SerialName("account_id") val accountId: String,
    @SerialName("transaction_type") val transactionType: String,
    val amount: String,
    val date: String,
    val note: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("deleted_at") val deletedAt: String? = null
)

@Serializable
data class RemoteExpenseTemplate(
    val id: String,
    @SerialName("dealer_id") val dealerId: String,
    val name: String,
    val category: String,
    @SerialName("default_description") val defaultDescription: String? = null,
    @SerialName("default_amount") val defaultAmount: String? = null,
    @SerialName("updated_at") val updatedAt: String,
    @SerialName("deleted_at") val deletedAt: String? = null
)

@Serializable
data class RemoteSnapshot(
    val users: List<RemoteDealerUser>,
    val accounts: List<RemoteFinancialAccount>,
    @SerialName("account_transactions") val accountTransactions: List<RemoteAccountTransaction>,
    val vehicles: List<RemoteVehicle>,
    val templates: List<RemoteExpenseTemplate>,
    val expenses: List<RemoteExpense>,
    val sales: List<RemoteSale>,
    val debts: List<RemoteDebt>,
    @SerialName("debt_payments") val debtPayments: List<RemoteDebtPayment>,
    val clients: List<RemoteClient>
)
