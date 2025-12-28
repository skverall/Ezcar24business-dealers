package com.ezcar24.business.ui.vehicle

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.outlined.Garage
import androidx.compose.material.icons.outlined.LocalOffer
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ezcar24.business.data.local.VehicleWithFinancials
import com.ezcar24.business.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterialApi::class)
@Composable
fun VehicleListScreen(
    viewModel: VehicleViewModel = hiltViewModel(),
    presetStatus: String? = null,
    showNavigation: Boolean = true,
    onNavigateToAddVehicle: () -> Unit = {},
    onNavigateToDetail: (String) -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    
    // Apply preset status filter when screen loads
    LaunchedEffect(presetStatus) {
        if (presetStatus != null) {
            viewModel.setStatusFilter(presetStatus)
        }
    }
    
    val pullRefreshState = rememberPullRefreshState(
        refreshing = uiState.isLoading,
        onRefresh = { viewModel.refresh() }
    )
    
    // Calculate dashboard metrics on the fly from the full list
    val allVehicles = uiState.vehicles
    val onSaleCount = allVehicles.count { it.vehicle.status == "on_sale" || (it.vehicle.status != "sold" && it.vehicle.status != "transit" && it.vehicle.status != "garage") }
    val inGarageCount = allVehicles.count { it.vehicle.status == "garage" }
    val inTransitCount = allVehicles.count { it.vehicle.status == "transit" }

    // Use specific colors to match the dark theme requested
    // We force a dark background for this screen to match iOS screenshot
    val secondaryColor = Color.Gray

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            if (showNavigation) {
                // Header Row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Vehicles",
                        style = MaterialTheme.typography.headlineLarge.copy(
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                    )
                    IconButton(
                        onClick = onNavigateToAddVehicle,
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = EzcarBlueBright,
                            contentColor = Color.White
                        )
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add Vehicle")
                    }
                }
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .pullRefresh(pullRefreshState)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 1. Segmented Control (Tabs)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(36.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant), // Dark gray implementation
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val isInventory = uiState.filterStatus != "sold"
                    
                    // Inventory Tab
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .padding(2.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isInventory) MaterialTheme.colorScheme.primaryContainer else Color.Transparent)
                            .clickable { viewModel.setStatusFilter(null) },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Inventory",
                            color = if (isInventory) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface,
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium)
                        )
                    }
                    
                    // Sold Tab
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .padding(2.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (!isInventory) MaterialTheme.colorScheme.primaryContainer else Color.Transparent)
                            .clickable { viewModel.setStatusFilter("sold") },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Sold",
                            color = if (!isInventory) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface,
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium)
                        )
                    }
                }

                // 2. Metrics Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                   StatusChip(
                       icon = Icons.Outlined.LocalOffer,
                       label = "On Sale",
                       count = onSaleCount,
                       color = EzcarGreen,
                       modifier = Modifier.weight(1f)
                   )
                   StatusChip(
                       icon = Icons.Outlined.Garage,
                       label = "In Garage",
                       count = inGarageCount,
                       color = EzcarOrange,
                       modifier = Modifier.weight(1f)
                   )
                   StatusChip(
                       icon = Icons.Outlined.LocalShipping,
                       label = "In Transit",
                       count = inTransitCount,
                       color = EzcarPurple,
                       modifier = Modifier.weight(1f)
                   )
                }

                // 3. Search Bar
                TextField(
                    value = uiState.searchQuery,
                    onValueChange = { viewModel.onSearchQueryChanged(it) },
                    placeholder = { Text("Search Make, Model, VIN...", color = Color.Gray) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color.Gray) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp)),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                        unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        focusedTextColor = MaterialTheme.colorScheme.onSurface,
                        unfocusedTextColor = MaterialTheme.colorScheme.onSurface
                    ),
                    singleLine = true
                )

                // 4. Vehicle List
                if (uiState.filteredVehicles.isEmpty() && !uiState.isLoading) {
                    Box(modifier = Modifier.fillMaxSize().weight(1f), contentAlignment = Alignment.Center) {
                        Text("No vehicles found", color = Color.Gray)
                    }
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        contentPadding = PaddingValues(bottom = 24.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        items(uiState.filteredVehicles) { item ->
                            VehicleItem(
                                item = item,
                                onClick = { onNavigateToDetail(item.vehicle.id.toString()) }
                            )
                        }
                    }
                }
            }
            
            PullRefreshIndicator(
                refreshing = uiState.isLoading,
                state = pullRefreshState,
                modifier = Modifier.align(Alignment.TopCenter),
                backgroundColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
fun StatusChip(
    icon: ImageVector,
    label: String,
    count: Int,
    color: Color,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(MaterialTheme.colorScheme.surface)
            .padding(vertical = 12.dp, horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = color,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Column {
            Text(text = label, style = MaterialTheme.typography.labelSmall, color = Color.Gray)
            Text(text = count.toString(), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun VehicleItem(
    item: VehicleWithFinancials,
    onClick: () -> Unit
) {
    val vehicle = item.vehicle
    val totalCost = vehicle.purchasePrice.add(item.totalExpenseCost ?: java.math.BigDecimal.ZERO)
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface), // Dark surface
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header: Icon + Title + Status
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Car Icon Placeholder
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.DirectionsCar,
                        contentDescription = "Car",
                        tint = Color.Gray,
                        modifier = Modifier.size(24.dp)
                    )
                }
                
                Spacer(modifier = Modifier.width(12.dp))
                
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${vehicle.make ?: ""} ${vehicle.model ?: ""}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "VIN: ${vehicle.vin}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
                
                // Status Badge
                Surface(
                    color = when(vehicle.status) {
                        "sold" -> Color(0xFF2E85EB).copy(alpha = 0.2f)
                        "garage" -> EzcarOrange.copy(alpha = 0.2f)
                        else -> EzcarGreen.copy(alpha = 0.2f) 
                    }, // Fallback green for on_sale
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = when(vehicle.status) {
                             "sold" -> "Sold"
                             "garage" -> "In Garage"
                             else -> "On Sale"
                        },
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = when(vehicle.status) {
                             "sold" -> Color(0xFF2E85EB)
                             "garage" -> EzcarOrange
                             else -> EzcarGreen
                        },
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Details Row: Year | Expenses | Date
            Row(
                modifier = Modifier.fillMaxWidth(), 
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CalendarToday, null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("${vehicle.year ?: "N/A"}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Build, null, tint = Color.Gray, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("${item.expenseCount} exp", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                }
                 Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Added: ${SimpleDateFormat("dd MMM", Locale.getDefault()).format(vehicle.createdAt)}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                }
            }
            
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant, modifier = Modifier.padding(vertical = 12.dp))
            
            // Price Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column {
                    Text("Purchase", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    Text(
                        text = "AED ${vehicle.purchasePrice}",
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Total Cost", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                    Text(
                        text = "AED $totalCost",
                        style = MaterialTheme.typography.titleMedium,
                        color = EzcarBlueBright,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

