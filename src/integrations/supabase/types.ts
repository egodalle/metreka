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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_connections: {
        Row: {
          access_token_encrypted: string | null
          created_at: string
          credentials_encrypted: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          platform: string
          refresh_token_encrypted: string | null
          store_name: string
          store_url: string | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string
          credentials_encrypted?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform: string
          refresh_token_encrypted?: string | null
          store_name: string
          store_url?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string
          credentials_encrypted?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          platform?: string
          refresh_token_encrypted?: string | null
          store_name?: string
          store_url?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          platform: string
          records_synced: number | null
          started_at: string
          status: string
          store_connection_id: string | null
          sync_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          platform: string
          records_synced?: number | null
          started_at?: string
          status?: string
          store_connection_id?: string | null
          sync_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          platform?: string
          records_synced?: number | null
          started_at?: string
          status?: string
          store_connection_id?: string | null
          sync_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_store_connection_id_fkey"
            columns: ["store_connection_id"]
            isOneToOne: false
            referencedRelation: "store_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      synced_customers: {
        Row: {
          created_at: string
          email: string | null
          external_customer_id: string
          first_order_date: string | null
          id: string
          last_order_date: string | null
          name: string | null
          phone: string | null
          platform: string
          raw_data: Json | null
          store_connection_id: string | null
          synced_at: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          external_customer_id: string
          first_order_date?: string | null
          id?: string
          last_order_date?: string | null
          name?: string | null
          phone?: string | null
          platform: string
          raw_data?: Json | null
          store_connection_id?: string | null
          synced_at?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          external_customer_id?: string
          first_order_date?: string | null
          id?: string
          last_order_date?: string | null
          name?: string | null
          phone?: string | null
          platform?: string
          raw_data?: Json | null
          store_connection_id?: string | null
          synced_at?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synced_customers_store_connection_id_fkey"
            columns: ["store_connection_id"]
            isOneToOne: false
            referencedRelation: "store_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      synced_orders: {
        Row: {
          cost_of_goods: number | null
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          discount_amount: number | null
          external_order_id: string
          id: string
          net_profit: number | null
          order_date: string
          order_number: string | null
          order_status: string | null
          payment_status: string | null
          platform: string
          platform_fees: number | null
          product_id: string | null
          product_name: string | null
          quantity: number
          raw_data: Json | null
          shipping_cost: number | null
          sku: string | null
          store_connection_id: string | null
          synced_at: string
          total_amount: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_of_goods?: number | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount_amount?: number | null
          external_order_id: string
          id?: string
          net_profit?: number | null
          order_date: string
          order_number?: string | null
          order_status?: string | null
          payment_status?: string | null
          platform: string
          platform_fees?: number | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          raw_data?: Json | null
          shipping_cost?: number | null
          sku?: string | null
          store_connection_id?: string | null
          synced_at?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_of_goods?: number | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount_amount?: number | null
          external_order_id?: string
          id?: string
          net_profit?: number | null
          order_date?: string
          order_number?: string | null
          order_status?: string | null
          payment_status?: string | null
          platform?: string
          platform_fees?: number | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          raw_data?: Json | null
          shipping_cost?: number | null
          sku?: string | null
          store_connection_id?: string | null
          synced_at?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synced_orders_store_connection_id_fkey"
            columns: ["store_connection_id"]
            isOneToOne: false
            referencedRelation: "store_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      synced_products: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string
          external_product_id: string
          id: string
          image_url: string | null
          inventory_quantity: number | null
          name: string
          platform: string
          price: number | null
          raw_data: Json | null
          sku: string | null
          status: string | null
          store_connection_id: string | null
          synced_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string
          external_product_id: string
          id?: string
          image_url?: string | null
          inventory_quantity?: number | null
          name: string
          platform: string
          price?: number | null
          raw_data?: Json | null
          sku?: string | null
          status?: string | null
          store_connection_id?: string | null
          synced_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string
          external_product_id?: string
          id?: string
          image_url?: string | null
          inventory_quantity?: number | null
          name?: string
          platform?: string
          price?: number | null
          raw_data?: Json | null
          sku?: string | null
          status?: string | null
          store_connection_id?: string | null
          synced_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synced_products_store_connection_id_fkey"
            columns: ["store_connection_id"]
            isOneToOne: false
            referencedRelation: "store_connections"
            referencedColumns: ["id"]
          },
        ]
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
