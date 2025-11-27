export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          listing_id: string | null
          payload: Json | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string | null
          payload?: Json | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string | null
          payload?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activities: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      admin_activity_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity_at: string
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity_at?: string
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity_at?: string
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          failed_login_attempts: number | null
          full_name: string | null
          id: string
          is_active: boolean
          last_login_at: string | null
          locked_until: string | null
          password_changed_at: string | null
          password_hash: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          password_changed_at?: string | null
          password_hash: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          locked_until?: string | null
          password_changed_at?: string | null
          password_hash?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      car_specs: {
        Row: {
          created_at: string
          display_name: string
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          country: string | null
          created_at: string
          display_name: string
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          display_name: string
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string
          display_name?: string
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message_at: string
          listing_id: string
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id: string
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id?: string
          seller_id?: string
        }
        Relationships: []
      }
      csrf_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_admin_notes: {
        Row: {
          admin_user_id: string | null
          created_at: string
          id: string
          listing_id: string
          note_text: string
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          listing_id: string
          note_text: string
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          note_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_admin_notes_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_admin_notes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_admin_notes_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          is_cover: boolean
          listing_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          accident_history: string | null
          body_type: string | null
          city: string | null
          condition: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          fuel_type: string | null
          id: string
          is_draft: boolean
          make: string | null
          mileage: number | null
          model: string | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_reason: string | null
          moderation_status: string | null
          owners_count: string | null
          phone: string | null
          price: number | null
          search_vector: unknown | null
          seller_type: string | null
          spec: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          transmission: string | null
          trim: string | null
          updated_at: string
          user_id: string
          views: number | null
          warranty: string | null
          whatsapp: string | null
          year: number | null
        }
        Insert: {
          accident_history?: string | null
          body_type?: string | null
          city?: string | null
          condition?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          fuel_type?: string | null
          id?: string
          is_draft?: boolean
          make?: string | null
          mileage?: number | null
          model?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
          owners_count?: string | null
          phone?: string | null
          price?: number | null
          search_vector?: unknown | null
          seller_type?: string | null
          spec?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          user_id: string
          views?: number | null
          warranty?: string | null
          whatsapp?: string | null
          year?: number | null
        }
        Update: {
          accident_history?: string | null
          body_type?: string | null
          city?: string | null
          condition?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          fuel_type?: string | null
          id?: string
          is_draft?: boolean
          make?: string | null
          mileage?: number | null
          model?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_reason?: string | null
          moderation_status?: string | null
          owners_count?: string | null
          phone?: string | null
          price?: number | null
          search_vector?: unknown | null
          seller_type?: string | null
          spec?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          user_id?: string
          views?: number | null
          warranty?: string | null
          whatsapp?: string | null
          year?: number | null
        }
        Relationships: []
      }
      message_reports: {
        Row: {
          additional_info: string | null
          admin_notes: string | null
          created_at: string | null
          id: string
          message_id: string
          reason: string
          reported_by: string
          reported_user: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          additional_info?: string | null
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          message_id: string
          reason?: string
          reported_by: string
          reported_user: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          additional_info?: string | null
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          message_id?: string
          reason?: string
          reported_by?: string
          reported_user?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          listing_id: string
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          listing_id: string
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          listing_id?: string
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_dealer: boolean | null
          location: string | null
          phone: string | null
          updated_at: string
          user_id: string
          verification_date: string | null
          verification_status: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_dealer?: boolean | null
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          verification_date?: string | null
          verification_status?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_dealer?: boolean | null
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          verification_date?: string | null
          verification_status?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      listing_stats: {
        Row: {
          accident_history: string | null
          condition: string | null
          created_at: string | null
          favorites_count: number | null
          id: string | null
          make: string | null
          model: string | null
          price: number | null
          tags: string[] | null
          title: string | null
          views: number | null
          year: number | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          is_dealer: boolean | null
          user_id: string | null
        }
        Relationships: []
      }
      safe_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_dealer: boolean | null
          location: string | null
          user_id: string | null
          verification_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_dealer?: boolean | null
          location?: string | null
          user_id?: string | null
          verification_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_dealer?: boolean | null
          location?: string | null
          user_id?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_add_listing_note: {
        Args: {
          p_admin_user_id: string
          p_listing_id: string
          p_note_text: string
          p_session_token?: string
        }
        Returns: Json
      }
      admin_bulk_suspend_users: {
        Args: {
          p_admin_user_id: string
          p_duration_hours?: number
          p_reason?: string
          p_suspend: boolean
          p_user_ids: string[]
        }
        Returns: Json
      }
      admin_bulk_update_verification: {
        Args: {
          p_admin_user_id: string
          p_reason?: string
          p_user_ids: string[]
          p_verification_status: string
        }
        Returns: Json
      }
      admin_delete_listing: {
        Args: {
          p_admin_user_id: string
          p_listing_id: string
          p_reason?: string
        }
        Returns: Json
      }
      admin_delete_user: {
        Args: { p_session_token: string; p_user_id: string }
        Returns: Json
      }
      admin_export_users_data: {
        Args: { p_include_activity_logs?: boolean; p_user_ids?: string[] }
        Returns: Json
      }
      admin_get_user_details: {
        Args: { p_user_id: string }
        Returns: Json
      }
      admin_moderate_listing: {
        Args:
          | {
              p_action: string
              p_admin_user_id: string
              p_listing_id: string
              p_reason?: string
            }
          | {
              p_action: string
              p_admin_user_id: string
              p_listing_id: string
              p_reason?: string
              p_session_token?: string
            }
        Returns: Json
      }
      admin_send_message_to_seller: {
        Args: {
          p_admin_user_id: string
          p_listing_id: string
          p_message_content: string
          p_session_token?: string
        }
        Returns: Json
      }
      admin_suspend_user: {
        Args: {
          p_duration_hours?: number
          p_suspend: boolean
          p_user_id: string
        }
        Returns: Json
      }
      admin_suspend_user_with_log: {
        Args: {
          p_admin_user_id: string
          p_duration_hours?: number
          p_reason?: string
          p_suspend: boolean
          p_user_id: string
        }
        Returns: Json
      }
      admin_update_listing_fields: {
        Args: {
          p_admin_user_id: string
          p_description?: string
          p_listing_id: string
          p_location?: string
          p_price?: number
          p_session_token?: string
          p_title?: string
        }
        Returns: Json
      }
      admin_update_listing_images: {
        Args: {
          p_admin_user_id: string
          p_cover_image_id?: string
          p_listing_id: string
          p_ordered_ids?: string[]
          p_session_token?: string
        }
        Returns: Json
      }
      admin_update_user_profile: {
        Args: {
          p_full_name?: string
          p_is_dealer?: boolean
          p_location?: string
          p_phone?: string
          p_user_id: string
          p_verification_status?: string
        }
        Returns: Json
      }
      admin_update_user_profile_with_log: {
        Args: {
          p_admin_user_id: string
          p_full_name?: string
          p_is_dealer?: boolean
          p_location?: string
          p_phone?: string
          p_user_id: string
          p_verification_status?: string
        }
        Returns: Json
      }
      authenticate_admin: {
        Args: {
          p_ip_address?: unknown
          p_password: string
          p_user_agent?: string
          p_username: string
        }
        Returns: Json
      }
      can_send_message: {
        Args: {
          p_listing_id: string
          p_receiver_id: string
          p_sender_id: string
        }
        Returns: boolean
      }
      change_admin_password: {
        Args: {
          p_current_password: string
          p_new_password: string
          p_session_token: string
        }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          action_type: string
          max_attempts?: number
          time_window_minutes?: number
          user_identifier: string
        }
        Returns: boolean
      }
      clean_expired_admin_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_csrf_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_listing_images: {
        Args: { p_listing_id: string }
        Returns: {
          created_at: string
          id: string
          is_cover: boolean
          sort_order: number
          url: string
        }[]
      }
      get_listings_for_admin: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
          p_status_filter?: string
        }
        Returns: {
          created_at: string
          id: string
          make: string
          model: string
          moderation_status: string
          price: number
          status: string
          title: string
          total_count: number
          updated_at: string
          user_email: string
          user_name: string
          views: number
          year: number
        }[]
      }
      get_messages_for_admin: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          listing_id: string
          listing_title: string
          receiver_email: string
          receiver_name: string
          sender_email: string
          sender_name: string
          total_count: number
        }[]
      }
      // Note: get_public_profile and get_public_profiles functions have been removed
      // in favor of RLS-based views (public_profiles and safe_profiles) for better security
      get_seller_stats: {
        Args: { seller_user_id: string }
        Returns: {
          active_listings: number
          company_name: string
          is_dealer: boolean
          member_since: string
          total_listings: number
          total_views: number
          verification_status: string
        }[]
      }
      get_user_activity_logs: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          action: string
          admin_username: string
          created_at: string
          details: Json
          id: string
          ip_address: unknown
          user_agent: string
        }[]
      }
      get_user_conversations: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          buyer_id: string
          id: string
          last_message_at: string
          latest_message: string
          latest_message_at: string
          listing_id: string
          listing_make: string
          listing_model: string
          listing_price: number
          listing_title: string
          other_avatar_url: string
          other_full_name: string
          seller_id: string
          unread_count: number
        }[]
      }
      get_users_for_admin: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sort_by?: string
          p_sort_order?: string
          p_status_filter?: string
        }
        Returns: {
          account_status: string
          banned_until: string
          created_at: string
          deleted_at: string
          email: string
          email_confirmed_at: string
          full_name: string
          is_dealer: boolean
          last_sign_in_at: string
          listings_count: number
          location: string
          messages_count: number
          phone: string
          total_count: number
          user_id: string
          verification_status: string
        }[]
      }
      has_role: {
        Args: { check_role: string }
        Returns: boolean
      }
      hash_password: {
        Args: { password: string }
        Returns: string
      }
      log_admin_activity: {
        Args: {
          p_action: string
          p_admin_user_id: string
          p_details?: Json
          p_ip_address?: unknown
          p_resource_id?: string
          p_resource_type?: string
          p_user_agent?: string
        }
        Returns: string
      }
      log_user_activity: {
        Args: {
          p_action: string
          p_admin_user_id?: string
          p_details?: Json
          p_ip_address?: unknown
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      logout_admin: {
        Args: { p_session_token: string }
        Returns: boolean
      }
      moderate_listing: {
        Args: { listing_id: string; new_status: string; reason?: string }
        Returns: undefined
      }
      validate_admin_session: {
        Args: { p_session_token: string }
        Returns: Json
      }
      validate_csrf_token: {
        Args: { token_value: string }
        Returns: boolean
      }
      verify_password: {
        Args: { hash: string; password: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
