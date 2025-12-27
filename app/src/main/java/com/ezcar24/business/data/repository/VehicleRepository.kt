package com.ezcar24.business.data.repository

import com.ezcar24.business.data.local.Vehicle
import com.ezcar24.business.data.local.VehicleDao
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VehicleRepository @Inject constructor(
    private val vehicleDao: VehicleDao
) {
    suspend fun getActiveVehicles(): List<Vehicle> {
        return vehicleDao.getAllActive()
    }
}
