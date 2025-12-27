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
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import kotlinx.coroutines.runBlocking

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Simple check for start destination
        val startDestination = runBlocking {
            if (authRepository.getCurrentUser() != null) "home" else "login"
        }

        setContent {
            CarDealerTrackerAndroidTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    
                    NavHost(navController = navController, startDestination = startDestination) {
                        composable("login") {
                            LoginScreen(
                                onLoginSuccess = {
                                    navController.navigate("home") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                }
                            )
                        }
                        composable("home") {
                            VehicleListScreen()
                        }
                    }
                }
            }
        }
    }
}