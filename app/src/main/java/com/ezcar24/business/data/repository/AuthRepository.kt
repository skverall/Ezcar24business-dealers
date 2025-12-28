package com.ezcar24.business.data.repository

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val client: SupabaseClient
) {
    val sessionStatus = client.auth.sessionStatus

    suspend fun login(email: String, password: String) {
        client.auth.signInWith(Email) {
            this.email = email
            this.password = password
        }
    }

    suspend fun signOut() {
        client.auth.signOut()
    }
    
    fun getCurrentUser() = client.auth.currentUserOrNull()

    suspend fun getDealerId(): String? {
        val user = client.auth.currentUserOrNull() ?: return null
        // Assuming metadata is a Map or JsonObject. 
        // Supabase-kt generic metadata access:
        return user.userMetadata?.get("dealer_id")?.toString()?.replace("\"", "")
    }
}
