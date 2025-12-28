package com.ezcar24.business.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
import java.math.BigDecimal
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Locale

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadData()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(bottom = 80.dp) // Space for BottomNav
    ) {
        // --- Top Bar ---
        item {
            DashboardTopBar()
        }

        // --- Financial Overview ---
        item {
            FinancialOverviewSection(uiState)
        }

        // --- Recent Expenses Header ---
        item {
            RecentExpensesHeader(onSeeAllClick = { /* TODO */ })
        }

        // --- Recent Expenses List ---
        if (uiState.recentExpenses.isEmpty()) {
            item {
                Text(
                    text = "No recent expenses",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 20.dp)
                )
            }
        } else {
            items(uiState.recentExpenses) { expense ->
                RecentExpenseItem(expense)
            }
        }
    }
}

@Composable
fun DashboardTopBar() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White)
            .padding(horizontal = 20.dp, vertical = 16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column {
                Text(
                    text = "Good Day", // Dynamic greeting later
                    style = MaterialTheme.typography.titleSmall,
                    color = Color.Gray
                )
                Text(
                    text = "Dashboard",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = EzcarNavy
                )
            }
            
            Row(spacing = 12.dp) {
                // Search Button
                IconButton(
                    onClick = { /* TODO */ },
                    modifier = Modifier
                        .size(40.dp)
                        .background(EzcarBackgroundLight, CircleShape)
                ) {
                    Icon(Icons.Default.Search, contentDescription = "Search", tint = EzcarNavy)
                }

                // Profile Button
                IconButton(
                    onClick = { /* TODO */ },
                    modifier = Modifier
                        .size(40.dp)
                        .background(EzcarBackgroundLight, CircleShape)
                ) {
                    Icon(Icons.Default.Person, contentDescription = "Profile", tint = EzcarNavy)
                }
                
                // Add Button (Primary)
                IconButton(
                    onClick = { /* TODO */ },
                    modifier = Modifier
                        .size(40.dp)
                        .background(EzcarNavy, CircleShape)
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add", tint = Color.White)
                }
            }
        }
    }
}

@Composable
fun Row(spacing: androidx.compose.ui.unit.Dp, content: @Composable RowScope.() -> Unit) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(spacing),
        verticalAlignment = Alignment.CenterVertically,
        content = content
    )
}

@Composable
fun FinancialOverviewSection(uiState: DashboardUiState) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp)) {
        // Row 1: Assets, Cash, Bank
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            FinancialCard(
                title = "Total Assets",
                amount = uiState.totalAssets,
                icon = Icons.Default.AccountBalance,
                baseColor = EzcarBlueBright,
                isHero = true,
                modifier = Modifier.weight(1f)
            )
            FinancialCard(
                title = "Cash",
                amount = uiState.totalCash,
                icon = Icons.Default.AttachMoney,
                baseColor = EzcarGreen,
                modifier = Modifier.weight(1f)
            )
            FinancialCard(
                title = "Bank",
                amount = uiState.totalBank,
                icon = Icons.Default.CreditCard,
                baseColor = EzcarPurple,
                modifier = Modifier.weight(1f)
            )
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        
        // Row 2: Revenue, Profit, Sold
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            FinancialCard(
                title = "Revenue",
                amount = uiState.totalRevenue,
                icon = Icons.Default.TrendingUp, // ChartLine equivalent
                baseColor = EzcarOrange, // Orange for Revenue
                modifier = Modifier.weight(1f)
            )
            FinancialCard(
                title = "Net Profit",
                amount = uiState.netProfit,
                icon = Icons.Default.MonetizationOn, // Dollar Circle
                baseColor = if (uiState.netProfit >= BigDecimal.ZERO) EzcarSuccess else EzcarDanger,
                isHero = true,
                modifier = Modifier.weight(1f)
            )
             FinancialCard(
                title = "Sold",
                valueStr = uiState.soldCount.toString(),
                icon = Icons.Default.CheckCircle,
                baseColor = EzcarBlueLight, // Cyan-ish
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun FinancialCard(
    title: String,
    amount: BigDecimal? = null,
    valueStr: String? = null,
    icon: ImageVector,
    baseColor: Color,
    isHero: Boolean = false,
    modifier: Modifier = Modifier
) {
    val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)
    val displayValue = valueStr ?: currencyFormat.format(amount ?: BigDecimal.ZERO)
    
    val backgroundColor = if (isHero) baseColor else Color.White
    val contentColor = if (isHero) Color.White else Color.Black
    val iconTint = if (isHero) Color.White else baseColor
    val iconBg = if (isHero) Color.White.copy(alpha = 0.2f) else baseColor.copy(alpha = 0.1f)

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(backgroundColor)
            .padding(12.dp)
            .height(100.dp), // Fixed height for alignment
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Icon Header
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(CircleShape)
                .background(iconBg),
                contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconTint,
                modifier = Modifier.size(16.dp)
            )
        }
        
        // Value & Title
        Column {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = if (isHero) Color.White.copy(alpha = 0.9f) else Color.Gray,
                maxLines = 1
            )
            Text(
                text = displayValue,
                style = MaterialTheme.typography.titleSmall, // Use smaller font to fit
                fontWeight = FontWeight.Bold,
                color = contentColor,
                maxLines = 1
            )
        }
    }
}

@Composable
fun RecentExpensesHeader(onSeeAllClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Recent Expenses",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = EzcarNavy
        )
        
        TextButton(onClick = onSeeAllClick) {
            Text("See All", color = EzcarBlueBright)
        }
    }
}

@Composable
fun RecentExpenseItem(expense: Expense) {
    val dateFormat = SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault())
    val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 6.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Category Icon
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(EzcarBackgroundLight),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Receipt, // Generic for now, map categories later
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
                Text(
                    text = dateFormat.format(expense.date),
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )
            }
            
            Text(
                text = currencyFormat.format(expense.amount),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = EzcarNavy
            )
        }
    }
}
