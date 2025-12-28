package com.ezcar24.business.ui.vehicle

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import android.util.Log
import com.ezcar24.business.data.local.Vehicle
import com.ezcar24.business.data.local.VehicleDao
import com.ezcar24.business.data.local.VehicleWithFinancials
import com.ezcar24.business.data.sync.CloudSyncEnvironment
import com.ezcar24.business.data.sync.CloudSyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject
import java.util.UUID
import java.util.Date
import java.math.BigDecimal

data class VehicleUiState(
    val vehicles: List<VehicleWithFinancials> = emptyList(),
    val filteredVehicles: List<VehicleWithFinancials> = emptyList(),
    val isLoading: Boolean = false,
    val filterStatus: String? = null, // null = inventory (all active except sold), "sold" = sold vehicles only
    val searchQuery: String = "",
    val selectedVehicle: Vehicle? = null
)

@HiltViewModel
class VehicleViewModel @Inject constructor(
    private val vehicleDao: VehicleDao,
    private val cloudSyncManager: CloudSyncManager
) : ViewModel() {

    private val tag = "VehicleViewModel"
    private val _uiState = MutableStateFlow(VehicleUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadVehicles()
    }

    fun setStatusFilter(status: String?) {
        _uiState.update { it.copy(filterStatus = status) }
        applyFilters()
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        applyFilters()
    }

    private fun applyFilters() {
        val currentState = _uiState.value
        val allVehicles = currentState.vehicles
        val status = currentState.filterStatus
        val query = currentState.searchQuery.trim().lowercase()

        val filtered = allVehicles.filter { item ->
            // Status Filter
            val matchesStatus = if (status == "sold") {
                 item.vehicle.status == "sold"
            } else {
                 item.vehicle.status != "sold"
            }

            // Search Filter
            val matchesSearch = if (query.isEmpty()) true else {
                val v = item.vehicle
                (v.make?.lowercase()?.contains(query) == true) ||
                (v.model?.lowercase()?.contains(query) == true) ||
                (v.vin.lowercase().contains(query)) ||
                (v.year?.toString()?.contains(query) == true)
            }

            matchesStatus && matchesSearch
        }
        _uiState.update { it.copy(filteredVehicles = filtered) }
    }

    fun loadVehicles() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            // Fetch all active vehicles with financials once
            val vehicles = vehicleDao.getAllActiveWithFinancials()
            _uiState.update { it.copy(vehicles = vehicles, isLoading = false) }
            applyFilters()
        }
    }

    fun refresh(force: Boolean = true) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val dealerId = CloudSyncEnvironment.currentDealerId
            if (dealerId != null) {
                try {
                    cloudSyncManager.manualSync(dealerId, force = force)
                } catch (e: Exception) {
                    Log.e(tag, "manualSync failed: ${e.message}", e)
                }
            } else {
                Log.w(tag, "refresh skipped: dealerId is null")
            }
            loadVehicles()
        }
    }

    fun selectVehicle(id: String) {
        viewModelScope.launch {
            try {
                val uuid = UUID.fromString(id)
                val vehicle = vehicleDao.getById(uuid)
                _uiState.update { it.copy(selectedVehicle = vehicle) }
            } catch (e: Exception) {
                Log.e(tag, "Failed to select vehicle", e)
                _uiState.update { it.copy(selectedVehicle = null) }
            }
        }
    }

    fun clearSelection() {
        _uiState.update { it.copy(selectedVehicle = null) }
    }

    fun deleteVehicle(id: UUID) {
        viewModelScope.launch {
            val vehicle = vehicleDao.getById(id)
            if (vehicle != null) {
                // Soft delete by setting deletedAt
                val deleted = vehicle.copy(deletedAt = Date(), updatedAt = Date())
                vehicleDao.upsert(deleted)
                // For now, reload list.
                loadVehicles()
                _uiState.update { it.copy(selectedVehicle = null) }
            }
        }
    }

    fun saveVehicle(
        id: String?,
        vin: String,
        make: String,
        model: String,
        year: Int?,
        purchasePrice: BigDecimal,
        askingPrice: BigDecimal?,
        status: String,
        notes: String
    ) {
        viewModelScope.launch {
            val now = Date()
            val vehicle = if (id != null) {
                // Update
                val existing = vehicleDao.getById(UUID.fromString(id)) ?: return@launch
                existing.copy(
                    vin = vin,
                    make = make,
                    model = model,
                    year = year,
                    purchasePrice = purchasePrice,
                    askingPrice = askingPrice,
                    status = status,
                    notes = notes,
                    updatedAt = now
                )
            } else {
                // Create
                Vehicle(
                    id = UUID.randomUUID(),
                    vin = vin,
                    make = make,
                    model = model,
                    year = year,
                    purchasePrice = purchasePrice,
                    purchaseDate = now, // In real app, user might pick date
                    status = status,
                    notes = notes,
                    askingPrice = askingPrice,
                    createdAt = now,
                    updatedAt = now,
                    // Nullables
                    deletedAt = null,
                    saleDate = null,
                    buyerName = null,
                    buyerPhone = null,
                    paymentMethod = null,
                    salePrice = null,
                    reportURL = null
                )
            }
            vehicleDao.upsert(vehicle)
            loadVehicles()
        }
    }
}

