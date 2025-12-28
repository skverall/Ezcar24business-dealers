package com.ezcar24.business.ui.vehicle

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import java.math.BigDecimal
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VehicleAddEditScreen(
    vehicleId: String?,
    onBack: () -> Unit,
    viewModel: VehicleViewModel = hiltViewModel()
) {
    // If editing, load the vehicle
    LaunchedEffect(vehicleId) {
        if (vehicleId != null) {
            viewModel.selectVehicle(vehicleId)
        } else {
            viewModel.clearSelection()
        }
    }

    val uiState by viewModel.uiState.collectAsState()
    val selectedVehicle = uiState.selectedVehicle
    val isEditing = vehicleId != null

    // Form State
    var vin by remember { mutableStateOf("") }
    var make by remember { mutableStateOf("") }
    var model by remember { mutableStateOf("") }
    var year by remember { mutableStateOf("") }
    var purchasePrice by remember { mutableStateOf("") }
    var askingPrice by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("owned") }
    var notes by remember { mutableStateOf("") }

    // Populate form when vehicle loads
    LaunchedEffect(selectedVehicle) {
        if (selectedVehicle != null && isEditing) {
            vin = selectedVehicle.vin
            make = selectedVehicle.make ?: ""
            model = selectedVehicle.model ?: ""
            year = selectedVehicle.year?.toString() ?: ""
            purchasePrice = selectedVehicle.purchasePrice.toPlainString()
            askingPrice = selectedVehicle.askingPrice?.toPlainString() ?: ""
            status = selectedVehicle.status
            notes = selectedVehicle.notes ?: ""
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isEditing) "Edit Vehicle" else "Add Vehicle") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    Button(
                        onClick = {
                            viewModel.saveVehicle(
                                id = vehicleId,
                                vin = vin,
                                make = make,
                                model = model,
                                year = year.toIntOrNull(),
                                purchasePrice = purchasePrice.toBigDecimalOrNull() ?: BigDecimal.ZERO,
                                askingPrice = askingPrice.toBigDecimalOrNull(),
                                status = status,
                                notes = notes
                            )
                            onBack()
                        },
                        enabled = vin.isNotBlank() && make.isNotBlank() && model.isNotBlank()
                    ) {
                        Text("Save")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = vin,
                onValueChange = { vin = it },
                label = { Text("VIN (Required)") },
                modifier = Modifier.fillMaxWidth()
            )

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                OutlinedTextField(
                    value = make,
                    onValueChange = { make = it },
                    label = { Text("Make") },
                    modifier = Modifier.weight(1f)
                )
                OutlinedTextField(
                    value = model,
                    onValueChange = { model = it },
                    label = { Text("Model") },
                    modifier = Modifier.weight(1f)
                )
            }

            OutlinedTextField(
                value = year,
                onValueChange = { if (it.all { char -> char.isDigit() }) year = it },
                label = { Text("Year") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = purchasePrice,
                onValueChange = { purchasePrice = it },
                label = { Text("Purchase Price") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = askingPrice,
                onValueChange = { askingPrice = it },
                label = { Text("Asking Price") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth()
            )

            Text("Status", style = MaterialTheme.typography.labelMedium)
            Row {
                listOf("owned", "sold", "reserved").forEach { s ->
                    FilterChip(
                        selected = status == s,
                        onClick = { status = s },
                        label = { Text(s.capitalize()) },
                        modifier = Modifier.padding(end = 8.dp)
                    )
                }
            }

            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notes") },
                modifier = Modifier.fillMaxWidth().height(100.dp),
                maxLines = 5
            )
        }
    }
}

private fun String.capitalize(): String {
    return this.replaceFirstChar { if (it.isLowerCase()) it.titlecase(java.util.Locale.getDefault()) else it.toString() }
}
