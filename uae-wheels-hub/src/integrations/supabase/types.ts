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
          ip_address: string | null
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
          ip_address?: string | null
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
          ip_address?: string | null
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
          admin_user_id: string | null
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_used_at: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
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
          email: string | null
          failed_login_attempts: number | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          locked_until: string | null
          password_change_required: boolean | null
          password_changed_at: string | null
          password_hash: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          locked_until?: string | null
          password_change_required?: boolean | null
          password_changed_at?: string | null
          password_hash: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string | null
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          locked_until?: string | null
          password_change_required?: boolean | null
          password_changed_at?: string | null
          password_hash?: string
          role?: string
          updated_at?: string
          username?: string
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
          status: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id: string
          seller_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id?: string
          seller_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listing_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_dealer_clients: {
        Row: {
          created_at: string
          dealer_id: string
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          preferred_date: string | null
          request_details: string | null
          status: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          dealer_id: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          preferred_date?: string | null
          request_details?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          dealer_id?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_date?: string | null
          request_details?: string | null
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_dealer_clients_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "crm_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_dealer_users: {
        Row: {
          created_at: string
          dealer_id: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dealer_id: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dealer_id?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_expense_templates: {
        Row: {
          category: string
          created_at: string
          dealer_id: string
          default_amount: number | null
          default_description: string | null
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          dealer_id: string
          default_amount?: number | null
          default_description?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          dealer_id?: string
          default_amount?: number | null
          default_description?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_expenses: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          date: string
          dealer_id: string
          deleted_at: string | null
          expense_description: string | null
          description: string | null
          id: string
          updated_at: string
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount?: number
          category: string
          created_at?: string
          date?: string
          dealer_id: string
          deleted_at?: string | null
          expense_description?: string | null
          description?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          date?: string
          dealer_id?: string
          deleted_at?: string | null
          expense_description?: string | null
          description?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "crm_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_financial_accounts: {
        Row: {
          account_type: string
          balance: number
          created_at: string
          dealer_id: string
          deleted_at: string | null
          id: string
          updated_at: string
        }
        Insert: {
          account_type: string
          balance?: number
          created_at?: string
          dealer_id: string
          deleted_at?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          account_type?: string
          balance?: number
          created_at?: string
          dealer_id?: string
          deleted_at?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_sales: {
        Row: {
          amount: number | null
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string
          date: string
          dealer_id: string
          deleted_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          profit: number | null
          sale_price: number
          status: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          amount?: number | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          date?: string
          dealer_id: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          profit?: number | null
          sale_price?: number
          status?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          amount?: number | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          date?: string
          dealer_id?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          profit?: number | null
          sale_price?: number
          status?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_sales_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "crm_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_vehicles: {
        Row: {
          created_at: string
          dealer_id: string
          deleted_at: string | null
          id: string
          make: string | null
          model: string | null
          notes: string | null
          photo_url: string | null
          purchase_date: string
          purchase_price: number
          sale_date: string | null
          sale_price: number | null
          status: string
          updated_at: string
          vin: string
          year: number | null
        }
        Insert: {
          created_at?: string
          dealer_id: string
          deleted_at?: string | null
          id?: string
          make?: string | null
          model?: string | null
          notes?: string | null
          photo_url?: string | null
          purchase_date?: string
          purchase_price?: number
          sale_date?: string | null
          sale_price?: number | null
          status?: string
          updated_at?: string
          vin: string
          year?: number | null
        }
        Update: {
          created_at?: string
          dealer_id?: string
          deleted_at?: string | null
          id?: string
          make?: string | null
          model?: string | null
          notes?: string | null
          photo_url?: string | null
          purchase_date?: string
          purchase_price?: number
          sale_date?: string | null
          sale_price?: number | null
          status?: string
          updated_at?: string
          vin?: string
          year?: number | null
        }
        Relationships: []
      }
      listing_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          listing_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          listing_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          listing_id?: string
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
          brand: string
          city: string
          color: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          image: string | null
          images: string[] | null
          is_draft: boolean | null
          kilometers: number
          location: string | null
          mileage: number | null
          model: string
          moderation_comment: string | null
          moderation_status: string | null
          price: number
          specs: string | null
          status: string | null
          title: string
          trim: string | null
          updated_at: string
          user_id: string
          views: number | null
          year: number
        }
        Insert: {
          brand: string
          city: string
          color?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image?: string | null
          images?: string[] | null
          is_draft?: boolean | null
          kilometers: number
          location?: string | null
          mileage?: number | null
          model: string
          moderation_comment?: string | null
          moderation_status?: string | null
          price: number
          specs?: string | null
          status?: string | null
          title: string
          trim?: string | null
          updated_at?: string
          user_id: string
          views?: number | null
          year: number
        }
        Update: {
          brand?: string
          city?: string
          color?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          image?: string | null
          images?: string[] | null
          is_draft?: boolean | null
          kilometers?: number
          location?: string | null
          mileage?: number | null
          model?: string
          moderation_comment?: string | null
          moderation_status?: string | null
          price?: number
          specs?: string | null
          status?: string | null
          title?: string
          trim?: string | null
          updated_at?: string
          user_id?: string
          views?: number | null
          year?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      listing_stats: {
        Row: {
          brand: string | null
          city: string | null
          color: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          description: string | null
          favorites_count: number | null
          featured: boolean | null
          id: string | null
          image: string | null
          images: string[] | null
          is_draft: boolean | null
          kilometers: number | null
          location: string | null
          mileage: number | null
          model: string | null
          moderation_comment: string | null
          moderation_status: string | null
          price: number | null
          specs: string | null
          status: string | null
          title: string | null
          trim: string | null
          updated_at: string | null
          user_id: string | null
          views: number | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      _admin_ip_allowed: {
        Args: {
          p_ip: unknown
        }
        Returns: boolean
      }
      admin_delete_user: {
        Args: {
          target_user_id: string
        }
        Returns: undefined
      }
      authenticate_admin: {
        Args: {
          p_username: string
          p_password: string
          p_ip_address?: unknown
          p_user_agent?: string
        }
        Returns: Json
      }
      change_admin_password: {
        Args: {
          p_session_token: string
          p_current_password: string
          p_new_password: string
        }
        Returns: Json
      }
      crm_can_access: {
        Args: {
          p_dealer_id: string
        }
        Returns: boolean
      }
      custom_access_token_hook: {
        Args: {
          event: Json
        }
        Returns: Json
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      hash_password: {
        Args: {
          password: string
        }
        Returns: string
      }
      log_admin_activity: {
        Args: {
          p_admin_id: string
          p_action: string
          p_resource_type?: string
          p_resource_id?: string
          p_details?: Json
        }
        Returns: undefined
      }
      provision_admin_user: {
        Args: {
          p_token: string
          p_username: string
          p_password: string
          p_email?: string
          p_full_name?: string
          p_request_ip?: unknown
        }
        Returns: Json
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verify_password: {
        Args: {
          password: string
          hash: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "dealer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never
