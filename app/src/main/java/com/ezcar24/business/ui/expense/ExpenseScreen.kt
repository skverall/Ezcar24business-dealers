package com.ezcar24.business.ui.expense

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ezcar24.business.data.local.Expense
import com.ezcar24.business.ui.theme.*
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpenseScreen(
    viewModel: ExpenseViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showAddSheet by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadData()
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            Column {
                ExpenseTopBar(
                    onAddClick = { showAddSheet = true }
                )
                ExpenseFilters(
                    uiState = uiState,
                    onDateFilterSelect = viewModel::setDateFilter,
                    onCategorySelect = viewModel::setCategoryFilter,
                    onVehicleSelect = viewModel::setVehicleFilter
                )
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddSheet = true },
                containerColor = EzcarNavy,
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add Expense")
            }
        }
    ) { padding ->
        if (uiState.filteredExpenses.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.MonetizationOn,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = Color.Gray.copy(alpha = 0.5f)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "No expenses found",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.Gray
                    )
                }
            }
        } else {
            ExpenseList(
                expenses = uiState.filteredExpenses,
                padding = padding,
                onDelete = viewModel::deleteExpense
            )
        }
    }
    
    if (showAddSheet) {
        AddExpenseSheet(
            onDismiss = { showAddSheet = false },
            onSave = { amount, date, desc, cat, veh, usr, acc ->
                viewModel.saveExpense(amount, date, desc, cat, veh, usr, acc)
                showAddSheet = false
            },
            vehicles = uiState.vehicles,
            users = uiState.users,
            accounts = uiState.accounts
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpenseTopBar(onAddClick: () -> Unit) {
    TopAppBar(
        title = { 
            Text(
                "Expenses",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = EzcarNavy
            ) 
        },
        actions = {
            IconButton(onClick = { /* TODO: Search */ }) {
                Icon(Icons.Default.Search, contentDescription = "Search", tint = EzcarNavy)
            }
            IconButton(onClick = onAddClick) {
                Icon(Icons.Default.Add, contentDescription = "Add", tint = EzcarNavy)
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color.White
        )
    )
}

@Composable
fun ExpenseFilters(
    uiState: ExpenseUiState,
    onDateFilterSelect: (DateFilter) -> Unit,
    onCategorySelect: (String) -> Unit,
    onVehicleSelect: (com.ezcar24.business.data.local.Vehicle?) -> Unit
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.background(Color.White)
    ) {
        // Date Filter
        items(DateFilter.values()) { filter ->
            FilterChip(
                selected = uiState.dateFilter == filter,
                onClick = { onDateFilterSelect(filter) },
                label = { Text(filter.label) }
            )
        }
        
        // Category Filter (Simplified for now)
        val categories = listOf("All", "Vehicle", "Personal", "Employee", "Office", "Marketing")
        items(categories) { cat ->
            FilterChip(
                selected = uiState.selectedCategory.equals(cat, ignoreCase = true),
                onClick = { onCategorySelect(cat) },
                label = { Text(cat) }
            )
        }
    }
}

@Composable
fun ExpenseList(
    expenses: List<Expense>,
    padding: PaddingValues,
    onDelete: (Expense) -> Unit
) {
    // Group by Date Bucket (Today, Yesterday, etc.)
    val grouped = expenses.groupBy { getDateBucket(it.date) }
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            top = padding.calculateTopPadding() + 8.dp,
            bottom = 80.dp // Space for Nav
        )
    ) {
        grouped.forEach { (bucket, list) ->
            item {
                Text(
                    text = bucket,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.Gray,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }
            
            items(list, key = { it.id }) { expense ->
                ExpenseRowItem(expense, onDelete)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpenseRowItem(expense: Expense, onDelete: (Expense) -> Unit) {
    val dismissState = rememberSwipeToDismissBoxState(
        confirmValueChange = {
            if (it == SwipeToDismissBoxValue.EndToStart) {
                onDelete(expense)
                true
            } else {
                false
            }
        }
    )

    SwipeToDismissBox(
        state = dismissState,
        backgroundContent = {
            val color = if (dismissState.dismissDirection == SwipeToDismissBoxValue.EndToStart) EzcarDanger else Color.Transparent
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp, vertical = 4.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(color)
                    .padding(horizontal = 20.dp),
                contentAlignment = Alignment.CenterEnd
            ) {
                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.White)
            }
        },
        content = {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
            ) {
                Row(
                    modifier = Modifier
                        .padding(16.dp)
                        .fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(EzcarBackgroundLight),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = getCategoryIcon(expense.category),
                            contentDescription = null,
                            tint = EzcarNavy
                        )
                    }
                    
                    Spacer(modifier = Modifier.width(12.dp))
                    
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = expense.expenseDescription ?: expense.category,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Medium
                        )
                        if (expense.vehicleId != null) {
                             Text(
                                text = "Vehicle Linked", 
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.Gray
                            )
                        }
                    }
                    
                    Text(
                        text = NumberFormat.getCurrencyInstance(Locale.US).format(expense.amount),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = EzcarNavy
                    )
                }
            }
        }
    )
}

fun getDateBucket(date: Date): String {
    val now = System.currentTimeMillis()
    val diff = now - date.time
    val dayMillis = 86400000L
    return when {
        diff < dayMillis -> "Today"
        diff < 2 * dayMillis -> "Yesterday"
        diff < 7 * dayMillis -> "Last 7 Days"
        diff < 30 * dayMillis -> "Last 30 Days"
        else -> "Older"
    }
}

fun getCategoryIcon(category: String): ImageVector {
    return when (category.lowercase()) {
        "vehicle" -> Icons.Default.DirectionsCar
        "personal" -> Icons.Default.Person
        "employee" -> Icons.Default.Work
        "office" -> Icons.Default.Business
        "marketing" -> Icons.Default.Campaign
        else -> Icons.Default.Receipt
    }
}
