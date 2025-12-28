package com.ezcar24.business.ui.expense

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import com.ezcar24.business.data.local.FinancialAccount
import com.ezcar24.business.data.local.User
import com.ezcar24.business.data.local.Vehicle
import com.ezcar24.business.ui.theme.*
import com.ezcar24.business.util.*
import java.math.BigDecimal
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddExpenseSheet(
    onDismiss: () -> Unit,
    onSave: (BigDecimal, Date, String, String, Vehicle?, User?, FinancialAccount?) -> Unit,
    vehicles: List<Vehicle>,
    users: List<User>,
    accounts: List<FinancialAccount>
) {
    var amountStr by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("vehicle") }
    var selectedVehicle by remember { mutableStateOf<Vehicle?>(null) }
    var selectedUser by remember { mutableStateOf<User?>(null) }
    var selectedAccount by remember { mutableStateOf<FinancialAccount?>(null) }
    var date by remember { mutableStateOf(Date()) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 40.dp), // Bottom padding for button
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                "New Expense",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = EzcarNavy
            )
            
            Spacer(modifier = Modifier.height(20.dp))
            
            // Amount Input (Hero)
            Text("AMOUNT", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("AED", style = MaterialTheme.typography.titleMedium, color = Color.Gray)
                Spacer(modifier = Modifier.width(8.dp))
                TextField(
                    value = amountStr,
                    onValueChange = { amountStr = it },
                    textStyle = MaterialTheme.typography.displayMedium.copy(fontWeight = FontWeight.Bold),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.Transparent,
                        unfocusedContainerColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent
                    ),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    placeholder = { Text("0", style = MaterialTheme.typography.displayMedium.copy(color = Color.LightGray)) }
                )
            }
            
            HorizontalDivider()
            Spacer(modifier = Modifier.height(16.dp))
            
            // Category Selector
            Text("CATEGORY", style = MaterialTheme.typography.labelSmall, color = Color.Gray, modifier = Modifier.fillMaxWidth())
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                CategoryOption("Vehicle", Icons.Default.DirectionsCar, selectedCategory) { selectedCategory = "vehicle" }
                CategoryOption("Personal", Icons.Default.Person, selectedCategory) { selectedCategory = "personal" }
                CategoryOption("Employee", Icons.Default.Work, selectedCategory) { selectedCategory = "employee" }
                CategoryOption("Office", Icons.Default.Business, selectedCategory) { selectedCategory = "office" }
            }
            
            Spacer(modifier = Modifier.height(20.dp))
            
            // Details
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Description") },
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Vehicle Selector
            if (selectedCategory == "vehicle") {
                ExposedDropdownMenuBoxGeneric(
                    label = "Vehicle",
                    options = vehicles,
                    selectedOption = selectedVehicle,
                    onOptionSelected = { selectedVehicle = it },
                    itemLabel = { "${it.year} ${it.make} ${it.model}" }
                )
                Spacer(modifier = Modifier.height(12.dp))
            }

            // User Selector
            ExposedDropdownMenuBoxGeneric(
                label = "Paid By",
                options = users,
                selectedOption = selectedUser,
                onOptionSelected = { selectedUser = it },
                itemLabel = { it.name ?: "Unknown" }
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = {
                    val amt = amountStr.toBigDecimalOrNull()
                    if (amt != null && amt > BigDecimal.ZERO) {
                        onSave(amt, date, description, selectedCategory, selectedVehicle, selectedUser, selectedAccount)
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = EzcarNavy),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("Save Expense", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun CategoryOption(name: String, icon: ImageVector, selected: String, onClick: () -> Unit) {
    val isSelected = selected.equals(name, ignoreCase = true)
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable(onClick = onClick)) {
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(if (isSelected) EzcarNavy else EzcarBackgroundLight),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = name,
                tint = if (isSelected) Color.White else Color.Gray
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(name, style = MaterialTheme.typography.labelSmall, color = if (isSelected) EzcarNavy else Color.Gray)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun <T> ExposedDropdownMenuBoxGeneric(
    label: String,
    options: List<T>,
    selectedOption: T?,
    onOptionSelected: (T) -> Unit,
    itemLabel: (T) -> String
) {
    var expanded by remember { mutableStateOf(false) }
    
    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded }
    ) {
        OutlinedTextField(
            value = selectedOption?.let(itemLabel) ?: "",
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier
                .menuAnchor()
                .fillMaxWidth()
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(itemLabel(option)) },
                    onClick = {
                        onOptionSelected(option)
                        expanded = false
                    }
                )
            }
        }
    }
}
