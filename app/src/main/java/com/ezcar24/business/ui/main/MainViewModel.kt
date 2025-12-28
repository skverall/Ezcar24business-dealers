package com.ezcar24.business.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ezcar24.business.data.repository.AuthRepository
import com.ezcar24.business.data.sync.CloudSyncEnvironment
import com.ezcar24.business.data.sync.CloudSyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val cloudSyncManager: CloudSyncManager
) : ViewModel() {

    private val _startDestination = MutableStateFlow<String?>(null)
    val startDestination = _startDestination.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading = _isLoading.asStateFlow()

    init {
        checkSession()
    }

    private fun checkSession() {
        viewModelScope.launch {
            val user = authRepository.getCurrentUser()
            if (user != null) {
                // User is logged in, try to get dealer ID and sync
                val dealerIdStr = authRepository.getDealerId()
                if (dealerIdStr != null) {
                    try {
                        val dealerId = UUID.fromString(dealerIdStr)
                        CloudSyncEnvironment.currentDealerId = dealerId
                        // Trigger Sync
                        launch {
                            cloudSyncManager.syncAfterLogin(dealerId)
                        }
                        _startDestination.value = "home"
                    } catch (e: Exception) {
                        e.printStackTrace()
                        // ID parse error? Fallback to login or stay?
                        // If we can't get dealer ID, we probably can't function.
                         _startDestination.value = "login"
                    }
                } else {
                    // Logged in but no dealer ID? Should not happen if auth flow is correct.
                     _startDestination.value = "home" // Proceed anyway, maybe default view?
                }
            } else {
                _startDestination.value = "login"
            }
            _isLoading.value = false
        }
    }
    
    fun onLoginSuccess() {
        checkSession()
    }
}
