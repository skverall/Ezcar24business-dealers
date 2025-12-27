package com.ezcar24.business.ui.vehicle

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ezcar24.business.data.local.Vehicle
import com.ezcar24.business.data.repository.VehicleRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class VehicleViewModel @Inject constructor(
    private val repository: VehicleRepository
) : ViewModel() {

    private val _vehicles = MutableStateFlow<List<Vehicle>>(emptyList())
    val vehicles = _vehicles.asStateFlow()

    init {
        loadVehicles()
    }

    fun loadVehicles() {
        viewModelScope.launch {
            _vehicles.value = repository.getActiveVehicles()
        }
    }
}
