package com.ezcar24.business.ui.vehicle

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ezcar24.business.data.local.Vehicle

@Composable
fun VehicleListScreen(
    viewModel: VehicleViewModel = hiltViewModel()
) {
    val vehicles by viewModel.vehicles.collectAsState()

    Scaffold(
        topBar = {
            SmallTopAppBar(title = { Text("Inventory") })
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(vehicles) { vehicle ->
                VehicleItem(vehicle)
            }
        }
    }
}

@Composable
fun VehicleItem(vehicle: Vehicle) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "${vehicle.year ?: ""} ${vehicle.make ?: ""} ${vehicle.model ?: ""}",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "VIN: ${vehicle.vin}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Purchased: ${vehicle.purchasePrice}",
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}
