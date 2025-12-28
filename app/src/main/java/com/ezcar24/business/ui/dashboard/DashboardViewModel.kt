package com.ezcar24.business.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ezcar24.business.data.local.Expense
import com.ezcar24.business.data.local.ExpenseDao
import com.ezcar24.business.data.local.FinancialAccount
import com.ezcar24.business.data.local.FinancialAccountDao
import com.ezcar24.business.data.local.Sale
import com.ezcar24.business.data.local.SaleDao
import com.ezcar24.business.data.local.VehicleDao
import dagger.hilt.android.lifecycle.HiltViewModel
import java.math.BigDecimal
import java.util.Date
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val vehicleDao: VehicleDao,
    private val financialAccountDao: FinancialAccountDao,
    private val expenseDao: ExpenseDao,
    private val saleDao: SaleDao
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            // Fetch raw data
            val vehicles = vehicleDao.getAllActive()
            val accounts = financialAccountDao.getAll()
            val sales = saleDao.getAll()
            val expenses = expenseDao.getAll()
            
            // Calculate Stats
            val totalAssets = vehicles.sumOf { it.purchasePrice }
            val totalCash = accounts.filter { it.accountType == "cash" }.sumOf { it.balance }
            val totalBank = accounts.filter { it.accountType == "bank" }.sumOf { it.balance }
            
            val totalRevenue = sales.mapNotNull { it.amount }.fold(BigDecimal.ZERO) { acc, amount -> acc.add(amount) }
            // Simplistic Profit: Revenue - All Expenses. (Real profit is per sale, but this is a dashboard summary)
            // iOS DashboardView uses `totalSalesProfit`, which seems to sum up profit of individual sales if calculated, or Revenue - Expenses.
            // For now, let's use: Revenue - All Expenses.
            val totalExpensesAmount = expenses.map { it.amount }.fold(BigDecimal.ZERO) { acc, amount -> acc.add(amount) }
            val netProfit = totalRevenue.subtract(totalExpensesAmount)
            
            val soldCount = sales.size
            
            // Get recent expenses (top 5)
            val recentExpenses = expenses.take(5)
            
            // Get today's expenses
            val today = Date() // TODO: Filter strictly for today
            val todaysExpenses = expenses.filter { 
                // Simple date check (should use Calendar/LocalDate for precision)
                it.date.time > (System.currentTimeMillis() - 86400000) 
            }

            _uiState.update { currentState ->
                currentState.copy(
                    totalAssets = totalAssets,
                    totalCash = totalCash,
                    totalBank = totalBank,
                    totalRevenue = totalRevenue,
                    netProfit = netProfit,
                    soldCount = soldCount,
                    recentExpenses = recentExpenses,
                    isLoading = false
                )
            }
        }
    }
}

data class DashboardUiState(
    val totalAssets: BigDecimal = BigDecimal.ZERO,
    val totalCash: BigDecimal = BigDecimal.ZERO,
    val totalBank: BigDecimal = BigDecimal.ZERO,
    val totalRevenue: BigDecimal = BigDecimal.ZERO,
    val netProfit: BigDecimal = BigDecimal.ZERO,
    val soldCount: Int = 0,
    val recentExpenses: List<Expense> = emptyList(),
    val isLoading: Boolean = true
)
