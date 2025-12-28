package com.ezcar24.business.ui.dashboard

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.toArgb
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
import kotlin.math.abs

@OptIn(ExperimentalMaterialApi::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel(),
    onNavigateToAccounts: () -> Unit,
    onNavigateToDebts: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val pullRefreshState = rememberPullRefreshState(
        refreshing = uiState.isLoading,
        onRefresh = { viewModel.refresh() }
    )
    
    LaunchedEffect(Unit) {
        viewModel.loadData()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .pullRefresh(pullRefreshState)
    ) {
        LazyColumn(
            contentPadding = PaddingValues(bottom = 80.dp), // Space for BottomNav
            modifier = Modifier.fillMaxSize()
        ) {
            // --- Top Bar ---
            item {
                DashboardTopBar(onProfileClick = onNavigateToSettings)
            }

            // --- Time Range Picker ---
            item {
                TimeRangePicker(
                    selectedRange = uiState.selectedRange,
                    onRangeSelected = { viewModel.onTimeRangeChange(it) }
                )
            }

            // --- Financial Overview ---
            item {
                FinancialOverviewSection(
                    uiState = uiState,
                    onNavigateToAccounts = onNavigateToAccounts,
                    onNavigateToDebts = onNavigateToDebts // In iOS this is "Sold", we will reuse the callback for now or null
                )
            }

            // --- Today's Expenses ---
            item {
                TodaysExpensesSection(
                    todaysExpenses = uiState.todaysExpenses,
                    onAddExpense = { /* TODO */ }
                )
            }

            // --- Summary Section (Total Spent & Breakdown) ---
            item {
                SummarySection(
                    totalSpent = uiState.totalExpensesInPeriod,
                    changePercent = uiState.periodChangePercent,
                    trendPoints = uiState.trendPoints,
                    categoryStats = uiState.categoryStats,
                    selectedRange = uiState.selectedRange
                )
            }

            // --- Recent Expenses ---
            item {
                RecentExpensesSection(
                    recentExpenses = uiState.recentExpenses,
                    onSeeAll = { /* TODO */ }
                )
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

@Composable
fun DashboardTopBar(onProfileClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background)
            .padding(horizontal = 20.dp, vertical = 12.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column {
                Text(
                    text = getGreeting(),
                    style = MaterialTheme.typography.titleSmall,
                    color = Color.Gray
                )
                Text(
                    text = "Dashboard",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                // Search Button
                IconButton(
                    onClick = { /* TODO */ },
                    modifier = Modifier
                        .size(40.dp)
                        .background(MaterialTheme.colorScheme.surfaceVariant, CircleShape)
                ) {
                    Icon(Icons.Default.Search, contentDescription = "Search", tint = MaterialTheme.colorScheme.primary)
                }

                // Profile Button
                IconButton(
                    onClick = onProfileClick,
                    modifier = Modifier
                        .size(40.dp)
                        .background(MaterialTheme.colorScheme.surfaceVariant, CircleShape)
                ) {
                    Icon(Icons.Default.Person, contentDescription = "Profile", tint = MaterialTheme.colorScheme.primary)
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

private fun getGreeting(): String {
    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    return when (hour) {
        in 0..11 -> "Good Morning"
        in 12..16 -> "Good Afternoon"
        else -> "Good Evening"
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimeRangePicker(
    selectedRange: DashboardTimeRange,
    onRangeSelected: (DashboardTimeRange) -> Unit
) {
    val ranges = DashboardTimeRange.values()
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 8.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        ranges.forEach { range ->
            val isSelected = range == selectedRange
            FilterChip(
                selected = isSelected,
                onClick = { onRangeSelected(range) },
                label = {
                    Text(
                        text = range.displayLabel,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
                    )
                },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = EzcarNavy,
                    selectedLabelColor = MaterialTheme.colorScheme.onPrimary,
                    containerColor = Color.Transparent,
                    labelColor = MaterialTheme.colorScheme.primary
                ),
                border = null,
                modifier = Modifier.weight(1f).padding(horizontal = 4.dp, vertical = 4.dp)
            )
        }
    }
}

@Composable
fun FinancialOverviewSection(
    uiState: DashboardUiState,
    onNavigateToAccounts: () -> Unit,
    onNavigateToDebts: () -> Unit
) {
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
                modifier = Modifier.weight(1f),
                onClick = onNavigateToAccounts
            )
            FinancialCard(
                title = "Bank",
                amount = uiState.totalBank,
                icon = Icons.Default.CreditCard,
                baseColor = EzcarPurple,
                modifier = Modifier.weight(1f),
                onClick = onNavigateToAccounts
            )
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        
        // Row 2: Revenue, Profit, Sold (Changed from Debts)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            FinancialCard(
                title = "Total Revenue",
                amount = uiState.totalRevenue,
                icon = Icons.Default.TrendingUp,
                baseColor = EzcarOrange,
                modifier = Modifier.weight(1f)
            )
            FinancialCard(
                title = "Net Profit",
                amount = uiState.netProfit,
                icon = Icons.Default.MonetizationOn,
                baseColor = if (uiState.netProfit >= BigDecimal.ZERO) EzcarSuccess else EzcarDanger,
                isHero = true,
                modifier = Modifier.weight(1f)
            )
             FinancialCard(
                title = "Sold",
                valueStr = uiState.soldCount.toString(),
                icon = Icons.Default.CheckCircle,
                baseColor = EzcarBlueLight, // Cyan-ish in iOS
                isCount = true,
                modifier = Modifier.weight(1f),
                onClick = { /* TODO: Navigate to sold list */ }
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
    isCount: Boolean = false,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)
    val displayValue = if (isCount && valueStr != null) valueStr else currencyFormat.format(amount ?: BigDecimal.ZERO)
    
    val backgroundColor = if (isHero) baseColor else MaterialTheme.colorScheme.surface
    val contentColor = if (isHero) Color.White else MaterialTheme.colorScheme.onSurface
    val iconTint = if (isHero) Color.White else baseColor
    val iconBg = if (isHero) Color.White.copy(alpha = 0.2f) else baseColor.copy(alpha = 0.1f)

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(backgroundColor)
            .clickable(enabled = onClick != null, onClick = onClick ?: {})
            .padding(12.dp)
            .height(100.dp),
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
                style = if (isCount) MaterialTheme.typography.titleLarge else MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = contentColor,
                maxLines = 1
            )
        }
    }
}

@Composable
fun TodaysExpensesSection(
    todaysExpenses: List<Expense>,
    onAddExpense: () -> Unit
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Today's Expenses",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                text = todaysExpenses.size.toString(),
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
        
        Spacer(modifier = Modifier.height(12.dp))

        if (todaysExpenses.isEmpty()) {
            EmptyTodayCard(onAddExpense)
        } else {
            // 2-Column Grid using Rows
            val chunked = todaysExpenses.chunked(2)
            chunked.forEach { rowItems ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    rowItems.forEach { expense ->
                        Box(modifier = Modifier.weight(1f)) {
                            TodayExpenseCard(expense)
                        }
                    }
                    // Fill empty space if odd number
                    if (rowItems.size == 1) {
                         Box(modifier = Modifier.weight(1f))
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
fun TodayExpenseCard(expense: Expense) {
    val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)
    val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(130.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                // Icon
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(EzcarBlueBright.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Receipt,
                        contentDescription = null,
                        tint = EzcarBlueBright,
                        modifier = Modifier.size(18.dp)
                    )
                }
                
                // Time
                Text(
                    text = timeFormat.format(expense.date),
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray,
                    modifier = Modifier
                        .background(MaterialTheme.colorScheme.background, CircleShape)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
            
            Column {
                Text(
                    text = currencyFormat.format(expense.amount),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = expense.expenseDescription ?: expense.category ?: "Expense",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray,
                    maxLines = 1
                )
            }
        }
    }
}

@Composable
fun EmptyTodayCard(onAddExpense: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.ListAlt,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = Color.Gray.copy(alpha = 0.5f)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "No expenses today",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium
            )
            Spacer(modifier = Modifier.height(12.dp))
            Button(
                onClick = onAddExpense,
                colors = ButtonDefaults.buttonColors(containerColor = EzcarNavy)
            ) {
                Text("Add Expense")
            }
        }
    }
}

@Composable
fun SummarySection(
    totalSpent: BigDecimal,
    changePercent: Double?,
    trendPoints: List<TrendPoint>,
    categoryStats: List<CategoryStat>,
    selectedRange: DashboardTimeRange
) {
    Column(
        modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        SummaryOverviewCard(totalSpent, changePercent, trendPoints, selectedRange)
        CategoryBreakdownCard(categoryStats)
    }
}

@Composable
fun SummaryOverviewCard(
    totalSpent: BigDecimal,
    changePercent: Double?,
    trendPoints: List<TrendPoint>,
    selectedRange: DashboardTimeRange
) {
    val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column {
                    Text(
                        text = "Total Spent (${selectedRange.displayLabel})",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Gray
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = currencyFormat.format(totalSpent),
                            style = MaterialTheme.typography.headlineLarge, // equivalent to 32pt
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        
                        if (changePercent != null) {
                            Spacer(modifier = Modifier.width(8.dp))
                            val isPositive = changePercent >= 0
                            val color = if (isPositive) EzcarDanger else EzcarSuccess // Use Danger for + spending? iOS logic
                            val bg = color.copy(alpha = 0.1f)
                            
                            Row(
                                modifier = Modifier
                                    .background(bg, CircleShape)
                                    .padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = if (isPositive) Icons.Default.ArrowOutward else Icons.Default.ArrowDownward,
                                    contentDescription = null,
                                    tint = color,
                                    modifier = Modifier.size(12.dp)
                                )
                                Text(
                                    text = "${String.format("%.1f", abs(changePercent))}%",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = color
                                )
                            }
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(20.dp))
            
            // Chart
            if (trendPoints.isNotEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp)
                ) {
                    SpendingTrendChart(points = trendPoints)
                }
            } else {
                Text(
                    text = "No spending data for this period",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }
        }
    }
}

@Composable
fun SpendingTrendChart(points: List<TrendPoint>) {
    val color = EzcarNavy
    
    Canvas(modifier = Modifier.fillMaxSize()) {
        if (points.isEmpty()) return@Canvas
        
        val width = size.width
        val height = size.height
        val maxVal = points.maxOf { it.value }
        val minVal = 0f // Baseline
        
        val range = if (maxVal - minVal == 0f) 1f else maxVal - minVal
        
        val stepX = width / (points.size - 1).coerceAtLeast(1)
        
        val path = Path()
        
        points.forEachIndexed { index, point ->
            val x = index * stepX
            val y = height - ((point.value - minVal) / range * height)
            
            if (index == 0) {
                path.moveTo(x, y)
            } else {
                // Bezier curve for smoothness (simplified)
                val prevX = (index - 1) * stepX
                val prevY = height - ((points[index - 1].value - minVal) / range * height)
                val cx1 = prevX + (x - prevX) / 2
                val cx2 = prevX + (x - prevX) / 2
                path.cubicTo(cx1, prevY, cx2, y, x, y)
            }
        }
        
        // Draw Fill
        val fillPath = Path()
        fillPath.addPath(path)
        fillPath.lineTo(width, height)
        fillPath.lineTo(0f, height)
        fillPath.close()
        
        drawPath(
            path = fillPath,
            brush = Brush.verticalGradient(
                colors = listOf(color.copy(alpha = 0.2f), color.copy(alpha = 0.0f))
            )
        )
        
        // Draw Line
        drawPath(
            path = path,
            color = color,
            style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
        )
    }
}

@Composable
fun CategoryBreakdownCard(stats: List<CategoryStat>) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text(
                text = "Spending Breakdown",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            if (stats.isEmpty()) {
                Text(
                    text = "No expenses for this period",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
            } else {
                stats.forEach { stat ->
                    CategoryBreakdownRow(stat)
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}

@Composable
fun CategoryBreakdownRow(stat: CategoryStat) {
    val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)
    val color = EzcarBlueBright // TODO: Use dynamic category color
    
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .background(color, CircleShape)
                )
                Text(
                    text = stat.title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
            }
            
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = currencyFormat.format(stat.amount),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "${String.format("%.1f", stat.percent)}%",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )
            }
        }
        
        // Progress Bar (Custom)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .background(MaterialTheme.colorScheme.surfaceVariant, CircleShape)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(stat.percent.toFloat() / 100f)
                    .background(color, CircleShape)
            )
        }
    }
}

@Composable
fun RecentExpensesSection(
    recentExpenses: List<Expense>,
    onSeeAll: () -> Unit
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Recent Expenses",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground
            )
            TextButton(
                onClick = onSeeAll,
                colors = ButtonDefaults.textButtonColors(contentColor = EzcarBlueBright)
            ) {
                Text("See All")
            }
        }
        
        if (recentExpenses.isEmpty()) {
            Text(
                text = "No recent expenses",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray,
                modifier = Modifier.padding(vertical = 12.dp)
            )
        } else {
            recentExpenses.forEach { expense ->
                RecentExpenseItem(expense)
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
fun RecentExpenseItem(expense: Expense) {
    val currencyFormat = NumberFormat.getCurrencyInstance(Locale.US)
    val dateFormat = SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault())

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(EzcarBlueBright.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Receipt, // Generic
                    contentDescription = null,
                    tint = EzcarBlueBright
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = expense.expenseDescription ?: expense.category ?: "Expense",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "${expense.vehicleTitle ?: "General"} • ${dateFormat.format(expense.date)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )
            }
            
            Text(
                text = currencyFormat.format(expense.amount),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

private val Expense.vehicleTitle: String? 
    get() = null // Placeholder, you might want to fetch vehicle info or if it's joined in query
