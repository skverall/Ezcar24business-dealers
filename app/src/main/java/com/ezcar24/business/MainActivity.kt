package com.ezcar24.business

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.ezcar24.business.data.repository.AuthRepository
import com.ezcar24.business.ui.auth.LoginScreen
import com.ezcar24.business.ui.theme.CarDealerTrackerAndroidTheme
import com.ezcar24.business.ui.vehicle.VehicleListScreen
import com.ezcar24.business.ui.main.MainScreen
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import kotlinx.coroutines.runBlocking

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            CarDealerTrackerAndroidTheme {
                // We use a Box or Surface as root
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val viewModel = androidx.hilt.navigation.compose.hiltViewModel<com.ezcar24.business.ui.main.MainViewModel>()
                    val navController = rememberNavController()
                    
                    val startDestination by viewModel.startDestination.collectAsState()
                    val isLoading by viewModel.isLoading.collectAsState()

                    if (isLoading || startDestination == null) {
                        // Splash Screen / Loading Indicator
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                             CircularProgressIndicator()
                        }
                    } else {
                        NavHost(navController = navController, startDestination = startDestination!!) {
                            composable("login") {
                                LoginScreen(
                                    onLoginSuccess = {
                                        viewModel.onLoginSuccess()
                                        // Navigation logic handled by observing startDestination if we wanted reactive, 
                                        // or manually navigate here:
                                        // Ideally, wait for ViewModel to update startDestination to "home"
                                        // But for simplicity, we navigate manually after trigger
                                        navController.navigate("home") {
                                            popUpTo("login") { inclusive = true }
                                        }
                                    }
                                )
                            }
                            composable("home") {
                                MainScreen(
                                    onNavigateToClientDetail = { clientId ->
                                        val route = if (clientId != null) "client_detail/$clientId" else "client_detail/new"
                                        navController.navigate(route)
                                    }
                                )
                            }
                            composable(
                                route = "client_detail/{clientId}",
                                arguments = listOf(androidx.navigation.navArgument("clientId") { type = androidx.navigation.NavType.StringType })
                            ) { backStackEntry ->
                                val clientId = backStackEntry.arguments?.getString("clientId")
                                com.ezcar24.business.ui.client.ClientDetailScreen(
                                    clientId = if (clientId == "new") null else clientId,
                                    onBack = { navController.popBackStack() }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}