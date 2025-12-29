package com.ezcar24.business.ui.vehicle

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ezcar24.business.data.local.FinancialAccount
import com.ezcar24.business.ui.theme.*
import java.math.BigDecimal
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class StatusOption(val value: String, val label: String)

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
    val accounts = uiState.accounts
    val isEditing = vehicleId != null

    // Status options matching iOS
    val statusOptions = listOf(
        StatusOption("owned", "Reserved"),
        StatusOption("on_sale", "On Sale"),
        StatusOption("in_transit", "In Transit"),
        StatusOption("under_service", "Under Service"),
        StatusOption("sold", "Sold")
    )

    // Form State
    var vin by remember { mutableStateOf("") }
    var make by remember { mutableStateOf("") }
    var model by remember { mutableStateOf("") }
    var year by remember { mutableStateOf("") }
    var purchasePrice by remember { mutableStateOf("") }
    var purchaseDate by remember { mutableStateOf(Date()) }
    var askingPrice by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("owned") }
    var notes by remember { mutableStateOf("") }
    var salePrice by remember { mutableStateOf("") }
    var saleDate by remember { mutableStateOf(Date()) }
    var selectedAccount by remember { mutableStateOf<FinancialAccount?>(null) }
    var selectedImageUri by remember { mutableStateOf<android.net.Uri?>(null) }

    // Date picker states
    var showPurchaseDatePicker by remember { mutableStateOf(false) }
    var showSaleDatePicker by remember { mutableStateOf(false) }
    var showAccountPicker by remember { mutableStateOf(false) }

    // Set default account when accounts load
    LaunchedEffect(accounts) {
        if (selectedAccount == null && accounts.isNotEmpty()) {
            selectedAccount = accounts.find { it.accountType.lowercase() == "cash" } ?: accounts.first()
        }
    }

    // Populate form when vehicle loads
    LaunchedEffect(selectedVehicle) {
        if (selectedVehicle != null && isEditing) {
            vin = selectedVehicle.vin
            make = selectedVehicle.make ?: ""
            model = selectedVehicle.model ?: ""
            year = selectedVehicle.year?.toString() ?: ""
            purchasePrice = selectedVehicle.purchasePrice.toPlainString()
            purchaseDate = selectedVehicle.purchaseDate
            askingPrice = selectedVehicle.askingPrice?.toPlainString() ?: ""
            status = selectedVehicle.status
            notes = selectedVehicle.notes ?: ""
            salePrice = selectedVehicle.salePrice?.toPlainString() ?: ""
            saleDate = selectedVehicle.saleDate ?: Date()
        }
    }

    // Validation
    val isFormValid = vin.isNotBlank() && 
                      make.isNotBlank() && 
                      model.isNotBlank() && 
                      year.isNotBlank() && 
                      purchasePrice.isNotBlank() &&
                      selectedAccount != null &&
                      (status != "sold" || salePrice.isNotBlank())

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isEditing) "Edit Vehicle" else "Add Vehicle") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.Close, contentDescription = "Cancel")
                    }
                },
                actions = {
                    TextButton(
                        onClick = {
                            viewModel.saveVehicle(
                                id = vehicleId,
                                vin = vin,
                                make = make,
                                model = model,
                                year = year.toIntOrNull(),
                                purchasePrice = purchasePrice.toBigDecimalOrNull() ?: BigDecimal.ZERO,
                                purchaseDate = purchaseDate,
                                askingPrice = askingPrice.toBigDecimalOrNull(),
                                status = status,
                                notes = notes,
                                salePrice = salePrice.toBigDecimalOrNull(),
                                saleDate = if (status == "sold") saleDate else null
                            )
                            onBack()
                        },
                        enabled = isFormValid
                    ) {
                        Text(
                            "Save", 
                            fontWeight = FontWeight.SemiBold,
                            color = if (isFormValid) EzcarGreen else Color.Gray
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = EzcarBackgroundLight
                )
            )
        },
        containerColor = EzcarBackgroundLight
    ) { paddingValues ->
        // Photo picker launcher
        val photoPickerLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
            contract = androidx.activity.result.contract.ActivityResultContracts.GetContent()
        ) { uri: android.net.Uri? ->
            selectedImageUri = uri
        }
        
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // --- Photo Section ---
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFF2F2F7))
                    .clickable { photoPickerLauncher.launch("image/*") },
                contentAlignment = Alignment.Center
            ) {
                if (selectedImageUri != null) {
                    // Show selected image
                    androidx.compose.foundation.Image(
                        painter = coil.compose.rememberAsyncImagePainter(selectedImageUri),
                        contentDescription = "Vehicle Photo",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = androidx.compose.ui.layout.ContentScale.Crop
                    )
                    // Edit overlay
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.3f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Edit,
                            contentDescription = "Change Photo",
                            tint = Color.White,
                            modifier = Modifier
                                .size(48.dp)
                                .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(50))
                                .padding(12.dp)
                        )
                    }
                } else {
                    // Placeholder
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.CameraAlt,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = Color.Gray
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Tap to add photo", color = Color.Gray)
                    }
                }
            }

            // --- Vehicle Details Section ---
            FormSection(title = "Vehicle Details", icon = Icons.Default.DirectionsCar) {
                CustomFormField(
                    label = "VIN",
                    value = vin,
                    onValueChange = { vin = it.uppercase() },
                    icon = Icons.Default.Numbers,
                    placeholder = "Enter VIN number"
                )
                
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    CustomFormField(
                        label = "Make",
                        value = make,
                        onValueChange = { make = it },
                        icon = Icons.Default.Label,
                        placeholder = "Toyota",
                        modifier = Modifier.weight(1f)
                    )
                    CustomFormField(
                        label = "Model",
                        value = model,
                        onValueChange = { model = it },
                        icon = Icons.Default.Label,
                        placeholder = "Camry",
                        modifier = Modifier.weight(1f)
                    )
                }
                
                CustomFormField(
                    label = "Year",
                    value = year,
                    onValueChange = { if (it.all { c -> c.isDigit() } && it.length <= 4) year = it },
                    icon = Icons.Default.CalendarToday,
                    keyboardType = KeyboardType.Number,
                    placeholder = "2024"
                )
            }

            // --- Purchase & Status Section ---
            FormSection(title = "Purchase & Status", icon = Icons.Default.AttachMoney) {
                CustomFormField(
                    label = "Purchase Price (AED)",
                    value = purchasePrice,
                    onValueChange = { purchasePrice = it.filter { c -> c.isDigit() || c == '.' } },
                    icon = Icons.Default.Money,
                    keyboardType = KeyboardType.Decimal,
                    placeholder = "0.00"
                )

                // Account Picker
                PickerField(
                    label = "Paid From",
                    value = selectedAccount?.accountType ?: "Select Account",
                    onClick = { showAccountPicker = true }
                )

                // Purchase Date Picker
                PickerField(
                    label = "Purchase Date",
                    value = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(purchaseDate),
                    onClick = { showPurchaseDatePicker = true }
                )

                Divider(color = Color.Gray.copy(alpha = 0.2f))

                // Status Picker
                Text(
                    "Status",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color.Gray
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    statusOptions.forEach { option ->
                        FilterChip(
                            selected = status == option.value,
                            onClick = { status = option.value },
                            label = { Text(option.label, style = MaterialTheme.typography.labelSmall) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EzcarGreen,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                }
            }

            // --- Sale Details Section (Conditional) ---
            if (status == "sold") {
                FormSection(title = "Sale Details", icon = Icons.Default.CheckCircle) {
                    CustomFormField(
                        label = "Sale Price (AED)",
                        value = salePrice,
                        onValueChange = { salePrice = it.filter { c -> c.isDigit() || c == '.' } },
                        icon = Icons.Default.Money,
                        keyboardType = KeyboardType.Decimal,
                        placeholder = "0.00"
                    )

                    PickerField(
                        label = "Sale Date",
                        value = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(saleDate),
                        onClick = { showSaleDatePicker = true }
                    )
                }
            }

            // --- Notes Section ---
            FormSection(title = "Notes", icon = Icons.Default.Notes) {
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(100.dp),
                    placeholder = { Text("Additional notes...") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.White,
                        unfocusedContainerColor = Color.White,
                        focusedBorderColor = EzcarGreen,
                        unfocusedBorderColor = Color.Gray.copy(alpha = 0.3f)
                    ),
                    shape = RoundedCornerShape(12.dp)
                )
            }

            Spacer(modifier = Modifier.height(40.dp))
        }
    }

    // Date Picker Dialogs
    if (showPurchaseDatePicker) {
        DatePickerDialog(
            onDismiss = { showPurchaseDatePicker = false },
            onDateSelected = { purchaseDate = it; showPurchaseDatePicker = false }
        )
    }

    if (showSaleDatePicker) {
        DatePickerDialog(
            onDismiss = { showSaleDatePicker = false },
            onDateSelected = { saleDate = it; showSaleDatePicker = false }
        )
    }

    // Account Picker Dialog
    if (showAccountPicker) {
        AlertDialog(
            onDismissRequest = { showAccountPicker = false },
            title = { Text("Select Account") },
            text = {
                Column {
                    accounts.forEach { account ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { 
                                    selectedAccount = account
                                    showAccountPicker = false
                                }
                                .padding(vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(account.accountType)
                            if (selectedAccount?.id == account.id) {
                                Icon(Icons.Default.Check, contentDescription = null, tint = EzcarGreen)
                            }
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showAccountPicker = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun FormSection(
    title: String,
    icon: ImageVector,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = EzcarGreen,
                modifier = Modifier.size(20.dp)
            )
            Text(
                title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold
            )
        }
        content()
    }
}

@Composable
fun CustomFormField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    keyboardType: KeyboardType = KeyboardType.Text
) {
    Column(modifier = modifier) {
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = Color.Gray
        )
        Spacer(modifier = Modifier.height(4.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text(placeholder, color = Color.Gray.copy(alpha = 0.5f)) },
            leadingIcon = {
                Icon(
                    icon,
                    contentDescription = null,
                    tint = EzcarGreen.copy(alpha = 0.6f),
                    modifier = Modifier.size(20.dp)
                )
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = EzcarBackgroundLight,
                unfocusedContainerColor = EzcarBackgroundLight,
                focusedBorderColor = EzcarGreen,
                unfocusedBorderColor = Color.Gray.copy(alpha = 0.2f)
            ),
            shape = RoundedCornerShape(10.dp)
        )
    }
}

@Composable
fun PickerField(
    label: String,
    value: String,
    onClick: () -> Unit
) {
    Column {
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = Color.Gray
        )
        Spacer(modifier = Modifier.height(4.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(EzcarBackgroundLight)
                .border(1.dp, Color.Gray.copy(alpha = 0.2f), RoundedCornerShape(10.dp))
                .clickable(onClick = onClick)
                .padding(horizontal = 12.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(value, color = Color.Black)
            Icon(
                Icons.Default.ChevronRight,
                contentDescription = null,
                tint = Color.Gray
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DatePickerDialog(
    onDismiss: () -> Unit,
    onDateSelected: (Date) -> Unit
) {
    val datePickerState = rememberDatePickerState()
    
    DatePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(
                onClick = {
                    datePickerState.selectedDateMillis?.let {
                        onDateSelected(Date(it))
                    }
                }
            ) {
                Text("OK")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    ) {
        DatePicker(state = datePickerState)
    }
}
