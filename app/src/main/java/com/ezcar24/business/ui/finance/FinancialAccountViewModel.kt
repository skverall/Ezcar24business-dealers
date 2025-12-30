package com.ezcar24.business.ui.finance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ezcar24.business.data.local.FinancialAccount
import com.ezcar24.business.data.local.FinancialAccountDao
import com.ezcar24.business.data.sync.CloudSyncEnvironment
import com.ezcar24.business.data.sync.CloudSyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.math.BigDecimal
import java.util.Date
import java.util.UUID
import javax.inject.Inject

data class FinancialAccountUiState(
    val accounts: List<FinancialAccount> = emptyList(),
    val isLoading: Boolean = false,
    val totalBalance: BigDecimal = BigDecimal.ZERO
)

@HiltViewModel
class FinancialAccountViewModel @Inject constructor(
    private val accountDao: FinancialAccountDao,
    private val cloudSyncManager: CloudSyncManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(FinancialAccountUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadAccounts()
    }

    fun loadAccounts() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            // Collect the Flow
            accountDao.getAll().collect { list ->
                val total = list.fold(BigDecimal.ZERO) { acc, item -> acc.add(item.balance) }
                _uiState.update { it.copy(accounts = list, totalBalance = total, isLoading = false) }
            }
        }
    }

    fun saveAccount(id: String?, name: String, initialBalance: BigDecimal) {
        viewModelScope.launch {
            val now = Date()
            val account = if (id != null) {
                val existing = accountDao.getById(UUID.fromString(id)) ?: return@launch
                existing.copy(
                    accountType = name, // Using accountType as Name per schema
                    balance = initialBalance,
                    updatedAt = now
                )
            } else {
                FinancialAccount(
                    id = UUID.randomUUID(),
                    accountType = name,
                    balance = initialBalance,
                    updatedAt = now,
                    deletedAt = null
                )
            }
            accountDao.upsert(account)
            // Trigger sync if needed (omitted for brevity, usually handled by worker or manual sync)
            loadAccounts()
        }
    }

    fun deleteAccount(id: UUID) {
        viewModelScope.launch {
            val account = accountDao.getById(id)
            if (account != null) {
                val deleted = account.copy(deletedAt = Date(), updatedAt = Date())
                accountDao.upsert(deleted)
                loadAccounts()
            }
        }
    }
}
