package com.ezcar24.business.ui.client

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ezcar24.business.data.local.*
import com.ezcar24.business.data.sync.CloudSyncEnvironment
import com.ezcar24.business.data.sync.CloudSyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import java.util.Date
import java.util.UUID
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ClientDetailUiState(
    val client: Client? = null,
    val interactions: List<ClientInteraction> = emptyList(),
    val reminders: List<ClientReminder> = emptyList(),
    val isLoading: Boolean = false,
    val isSaving: Boolean = false
)

@HiltViewModel
class ClientDetailViewModel @Inject constructor(
    private val clientDao: ClientDao,
    private val interactionDao: ClientInteractionDao,
    private val reminderDao: ClientReminderDao,
    private val cloudSyncManager: CloudSyncManager,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow(ClientDetailUiState())
    val uiState: StateFlow<ClientDetailUiState> = _uiState.asStateFlow()

    private val clientIdString: String? = savedStateHandle.get<String>("clientId")

    init {
        if (clientIdString != null && clientIdString != "new") {
            loadClient(UUID.fromString(clientIdString))
        }
    }

    private fun loadClient(id: UUID) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val client = clientDao.getById(id)
            val interactions = interactionDao.getByClient(id)
            val reminders = reminderDao.getByClient(id)
            _uiState.update { 
                it.copy(
                    client = client, 
                    interactions = interactions,
                    reminders = reminders,
                    isLoading = false
                )
            }
        }
    }

    fun saveClient(
        name: String,
        phone: String,
        email: String,
        notes: String,
        status: String?,
        // Add other fields as needed
    ) {
        viewModelScope.launch {
            // TODO: Implement save logic
        }
    }
}
