package com.ezcar24.business.ui.client

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.ExperimentalFoundationApi
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
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.ezcar24.business.data.local.Client
import com.ezcar24.business.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class, ExperimentalMaterialApi::class)
@Composable
fun ClientListScreen(
    onNavigateToDetail: (String?) -> Unit,
    viewModel: ClientViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showFilters by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val pullRefreshState = rememberPullRefreshState(
        refreshing = uiState.isLoading,
        onRefresh = { viewModel.refresh() }
    )

    LaunchedEffect(Unit) {
        viewModel.loadData()
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            ClientTopBar(
                onFilterClick = { showFilters = !showFilters },
                onAddClick = { onNavigateToDetail(null) }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .pullRefresh(pullRefreshState)
        ) {
            Column {
            // Search Bar
            SearchBar(
                searchText = uiState.searchText, 
                onSearchChange = viewModel::onSearchTextChange
            )

            // Filter Chips
            if (showFilters) {
                ClientFilters(
                    selectedFilter = uiState.dateFilter,
                    onFilterSelected = viewModel::onDateFilterChange
                )
            }

            if (uiState.filteredClients.isEmpty()) {
                EmptyClientState()
            } else {
                ClientGroupedList(
                    clients = uiState.filteredClients,
                    onClientClick = { onNavigateToDetail(it.id.toString()) },
                    onCallClick = { client ->
                        client.phone?.let { phone ->
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                            context.startActivity(intent)
                        }
                    },
                    onWhatsAppClick = { client ->
                        client.phone?.let { phone ->
                            val url = "https://wa.me/${phone.replace(Regex("[^0-9]"), "")}"
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                            context.startActivity(intent)
                        }
                    }
                )
            } // else
            }
            PullRefreshIndicator(
                refreshing = uiState.isLoading,
                state = pullRefreshState,
                modifier = Modifier.align(Alignment.TopCenter),
                backgroundColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary
            )
        }
    } // Scaffold
}

@Composable
fun ClientTopBar(onFilterClick: () -> Unit, onAddClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "Clients",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.width(8.dp))
            IconButton(onClick = onFilterClick) {
                Icon(
                    imageVector = Icons.Default.FilterList,
                    contentDescription = "Filter",
                    tint = EzcarNavy
                )
            }
        }

        IconButton(
            onClick = onAddClick,
            modifier = Modifier
                .size(40.dp)
                .background(EzcarNavy, CircleShape)
        ) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = "Add Client",
                tint = Color.White
            )
        }
    }
}

@Composable
fun SearchBar(searchText: String, onSearchChange: (String) -> Unit) {
    TextField(
        value = searchText,
        onValueChange = onSearchChange,
        placeholder = { Text("Search by name, phone...", color = Color.Gray) },
        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = Color.Gray) },
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .height(56.dp)
            .clip(RoundedCornerShape(12.dp))
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant), // Explicit white input bg
        colors = TextFieldDefaults.colors(
            focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
            unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
            disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant,
            focusedIndicatorColor = Color.Transparent,
            unfocusedIndicatorColor = Color.Transparent
        ),
        singleLine = true
    )
}

@Composable
fun ClientFilters(selectedFilter: DateFilterType, onFilterSelected: (DateFilterType) -> Unit) {
    val filters = DateFilterType.values()
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.padding(vertical = 12.dp)
    ) {
        items(filters) { filter ->
            val isSelected = filter == selectedFilter
            FilterChip(
                selected = isSelected,
                onClick = { onFilterSelected(filter) },
                label = { Text(filter.name) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = EzcarNavy,
                    selectedLabelColor = Color.White,
                    containerColor = Color.White,
                    labelColor = EzcarNavy
                ),
                border = FilterChipDefaults.filterChipBorder(
                    enabled = true,
                    selected = isSelected,
                    borderColor = if (isSelected) EzcarNavy else Color.Transparent
                )
            )
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ClientGroupedList(
    clients: List<Client>,
    onClientClick: (Client) -> Unit,
    onCallClick: (Client) -> Unit,
    onWhatsAppClick: (Client) -> Unit
) {
    // Group by status
    val grouped = clients.groupBy { it.status ?: "new" } // Use safe access
    // Define order
    val statusOrder = listOf("new", "engaged", "negotiation", "purchased", "lost")

    LazyColumn(
        contentPadding = PaddingValues(bottom = 80.dp)
    ) {
        statusOrder.forEach { status ->
            val statusClients = grouped[status]
            if (!statusClients.isNullOrEmpty()) {
                stickyHeader {
                    ClientStatusHeader(status = status, count = statusClients.size)
                }
                items(statusClients) { client ->
                    ClientRow(
                        client = client,
                        onClick = { onClientClick(client) },
                        onCall = { onCallClick(client) },
                        onWhatsApp = { onWhatsAppClick(client) }
                    )
                }
            }
        }
    }
}

@Composable
fun ClientStatusHeader(status: String, count: Int) {
    val displayStatus = when(status) {
        "new" -> "NEW LEADS"
        "engaged" -> "ENGAGED"
        "negotiation" -> "NEGOTIATION"
        "purchased" -> "PURCHASED"
        "lost" -> "LOST"
        else -> status.uppercase()
    }
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.background.copy(alpha = 0.95f)) // Use correct background
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = displayStatus,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            color = Color.Gray
        )
        Text(
            text = count.toString(),
            style = MaterialTheme.typography.labelMedium,
            color = Color.Gray
        )
    }
}

@Composable
fun ClientRow(
    client: Client,
    onClick: () -> Unit,
    onCall: () -> Unit,
    onWhatsApp: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(12.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Identifier / Avatar
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = client.name?.firstOrNull()?.uppercase() ?: "?",
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = client.name ?: "Unknown",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = SimpleDateFormat("d MMM", Locale.getDefault()).format(client.createdAt ?: Date()),
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )
            }

            // Quick Actions
            if (!client.phone.isNullOrBlank()) {
                IconButton(
                    onClick = onCall,
                    modifier = Modifier
                        .size(32.dp)
                        .background(EzcarGreen.copy(alpha = 0.1f), CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Phone,
                        contentDescription = "Call",
                        tint = EzcarGreen,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                IconButton(
                    onClick = onWhatsApp,
                    modifier = Modifier
                        .size(32.dp)
                        .background(EzcarGreen.copy(alpha = 0.1f), CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Message, // Ideally WhatsApp icon, using Message for now
                        contentDescription = "WhatsApp",
                        tint = EzcarGreen,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun EmptyClientState() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.PersonSearch,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = Color.Gray.copy(alpha = 0.5f)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No Clients Found",
            style = MaterialTheme.typography.titleMedium,
            color = Color.Gray
        )
        Text("Tap + to add a new client", style = MaterialTheme.typography.bodyMedium, color = Color.LightGray)
    }
}

fun getStatusDisplayName(status: String): String {
    return when(status) {
        "new" -> "New Leads"
        "engaged" -> "Engaged"
        "negotiation" -> "Negotiation"
        "purchased" -> "Purchased"
        "lost" -> "Lost"
        else -> "Others"
    }
}
