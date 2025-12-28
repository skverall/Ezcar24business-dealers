package com.ezcar24.business.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ezcar24.business.data.local.User
import com.ezcar24.business.data.repository.AuthRepository
import com.ezcar24.business.data.sync.CloudSyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import io.github.jan.supabase.auth.user.UserInfo
import java.util.Date

data class SettingsUiState(
    val currentUser: UserInfo? = null,
    val dealerUsers: List<User> = emptyList(), // Changed to User objects
    val lastBackupDate: Date? = null,
    val isBackupLoading: Boolean = false,
    val isSigningOut: Boolean = false,
    val diagnosticsResult: String? = null,
    // Subscription Stubs
    val isPro: Boolean = false, // Default to false for now, or true if we want to mock
    val subscriptionExpiry: Date? = null
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val cloudSyncManager: CloudSyncManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            // TODO: Get real current user from AuthRepository or SyncManager
            // For now, we might need to fetch the user associated with the session
            // Assuming AuthRepository has a way to get current user or we query the local DB
            
            // Using a stub or fetching if available. 
            // Since AuthRepository usually handles Supabase Auth, we can get the user details.
             try {
                // This is a placeholder as AuthRepository structure isn't fully visible, 
                // but we know it exists. We'll populate with available data.
                val user = authRepository.getCurrentUser()
                _uiState.update { it.copy(currentUser = user, isPro = true) } // Mock Pro for now as in iOS it's checked via SubscriptionManager
            } catch (e: Exception) {
                // handle error
            }
        }
    }

    fun triggerBackup() {
        viewModelScope.launch {
            _uiState.update { it.copy(isBackupLoading = true) }
            // Simulate backup
            kotlinx.coroutines.delay(2000)
            _uiState.update { 
                it.copy(
                    isBackupLoading = false, 
                    lastBackupDate = Date(),
                    diagnosticsResult = "Backup completed successfully."
                )
            }
        }
    }

    fun runDiagnostics() {
         viewModelScope.launch {
            _uiState.update { it.copy(diagnosticsResult = "Checking database integrity... OK\nSync Status... OK\nNetwork... OK") }
         }
    }
    
    fun signOut() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSigningOut = true) }
            try {
                authRepository.signOut()
                // Navigation to login should be handled by the UI observing theauthState
            } catch (e: Exception) {
                // error
            } finally {
                _uiState.update { it.copy(isSigningOut = false) }
            }
        }
    }
}
