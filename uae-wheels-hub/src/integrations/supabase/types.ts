export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_emails: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      cars: {
        Row: {
          created_at: string
          description: string | null
          engine: string | null
          featured: boolean
          fuel: string
          id: number
          image: string | null
          image_version: number | null
          make: string
          mileage: number
          model: string
          most_wanted: boolean
          price: number
          shipping: string | null
          status: string | null
          transmission: string
          type: string
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          engine?: string | null
          featured?: boolean
          fuel: string
          id?: never
          image?: string | null
          image_version?: number | null
          make: string
          mileage: number
          model: string
          most_wanted?: boolean
          price: number
          shipping?: string | null
          status?: string | null
          transmission: string
          type: string
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          engine?: string | null
          featured?: boolean
          fuel?: string
          id?: never
          image?: string | null
          image_version?: number | null
          make?: string
          mileage?: number
          model?: string
          most_wanted?: boolean
          price?: number
          shipping?: string | null
          status?: string | null
          transmission?: string
          type?: string
          year?: number
        }
        Relationships: []
      }
      dealer_users: {
        Row: {
          created_at: string
          dealer_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dealer_id: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dealer_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          updated_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount?: number
          category: string
          created_at?: string
          date: string
          description?: string | null
          id: string
          updated_at?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_fk"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dealer_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vehicle_fk"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      }
      financial_accounts: {
        Row: {
          account_type: string
          balance: number
          dealer_id: string
          id: string
          updated_at: string
        }
        Insert: {
          account_type: string
          balance?: number
          dealer_id: string
          id: string
          updated_at?: string
        }
        Update: {
          account_type?: string
          balance?: number
          dealer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
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
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      }
      listings: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_draft: boolean
          make: string
          mileage: number
          model: string
          price: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_draft?: boolean
          make: string
          mileage: number
          model: string
          price: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_draft?: boolean
          make?: string
          mileage?: number
          model?: string
          price?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          buyer_name: string
          created_at: string
          date: string
          dealer_id: string
          id: string
          notes: string | null
          profit: number
          sale_price: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          buyer_name: string
          created_at?: string
          date: string
          dealer_id: string
          id: string
          notes?: string | null
          profit: number
          sale_price: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          buyer_name?: string
          created_at?: string
          date?: string
          dealer_id?: string
          id?: string
          notes?: string | null
          profit?: number
          sale_price?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          dealer_id: string
          id: string
          make: string | null
          model: string | null
          purchase_price: number | null
          status: string
          updated_at: string
          vin: string
          year: number | null
        }
        Insert: {
          created_at?: string
          dealer_id: string
          id: string
          make?: string | null
          model?: string | null
          purchase_price?: number | null
          status?: string
          updated_at?: string
          vin: string
          year?: number | null
        }
        Update: {
          created_at?: string
          dealer_id?: string
          id?: string
          make?: string | null
          model?: string | null
          purchase_price?: number | null
          status?: string
          updated_at?: string
          vin?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
