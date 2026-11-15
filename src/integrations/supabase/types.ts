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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      animals: {
        Row: {
          animal_key: string
          created_at: string
          id: string
          ready_at: string | null
          user_id: string
        }
        Insert: {
          animal_key: string
          created_at?: string
          id?: string
          ready_at?: string | null
          user_id: string
        }
        Update: {
          animal_key?: string
          created_at?: string
          id?: string
          ready_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "animals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          active_recipe: string | null
          building_key: string
          created_at: string
          ready_at: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          active_recipe?: string | null
          building_key: string
          created_at?: string
          ready_at?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          active_recipe?: string | null
          building_key?: string
          created_at?: string
          ready_at?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          crop_key: string
          field_id: number
          planted_at: string
          ready_at: string
          user_id: string
        }
        Insert: {
          crop_key: string
          field_id: number
          planted_at?: string
          ready_at: string
          user_id: string
        }
        Update: {
          crop_key?: string
          field_id?: number
          planted_at?: string
          ready_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crops_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_trades: {
        Row: {
          created_at: string
          id: string
          item_key: string
          price: number
          quantity: number
          recipient_id: string
          resolved_at: string | null
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_key: string
          price: number
          quantity: number
          recipient_id: string
          resolved_at?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_key?: string
          price?: number
          quantity?: number
          recipient_id?: string
          resolved_at?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_trades_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_trades_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_state: {
        Row: {
          coins: number
          level: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          coins?: number
          level?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          coins?: number
          level?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "farm_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_stats: {
        Row: {
          animal_products: number
          crafted: number
          gathered: number
          harvested: number
          planted: number
          trades: number
          user_id: string
        }
        Insert: {
          animal_products?: number
          crafted?: number
          gathered?: number
          harvested?: number
          planted?: number
          trades?: number
          user_id: string
        }
        Update: {
          animal_products?: number
          crafted?: number
          gathered?: number
          harvested?: number
          planted?: number
          trades?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          item_key: string
          quantity: number
          user_id: string
        }
        Insert: {
          item_key: string
          quantity: number
          user_id: string
        }
        Update: {
          item_key?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger: {
        Row: {
          action_key: string
          coins: number
          created_at: string
          description: string
          id: number
          item_key: string | null
          quantity: number
          user_id: string
        }
        Insert: {
          action_key: string
          coins?: number
          created_at?: string
          description: string
          id?: never
          item_key?: string | null
          quantity?: number
          user_id: string
        }
        Update: {
          action_key?: string
          coins?: number
          created_at?: string
          description?: string
          id?: never
          item_key?: string | null
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      market_listings: {
        Row: {
          buyer_id: string | null
          created_at: string
          filled_at: string | null
          id: string
          item_key: string
          quantity: number
          seller_id: string
          status: string
          unit_price: number
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          filled_at?: string | null
          id?: string
          item_key: string
          quantity: number
          seller_id: string
          status?: string
          unit_price: number
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          filled_at?: string | null
          id?: string
          item_key?: string
          quantity?: number
          seller_id?: string
          status?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_listings_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_regions: {
        Row: {
          region_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          region_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          region_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_regions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          farmer_name: string
          id: string
        }
        Insert: {
          created_at?: string
          farmer_name: string
          id: string
        }
        Update: {
          created_at?: string
          farmer_name?: string
          id?: string
        }
        Relationships: []
      }
      quest_claims: {
        Row: {
          claimed_at: string
          quest_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          quest_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          quest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_nodes: {
        Row: {
          node_key: string
          ready_at: string
          user_id: string
        }
        Insert: {
          node_key: string
          ready_at?: string
          user_id: string
        }
        Update: {
          node_key?: string
          ready_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_nodes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_farm_experience: {
        Args: { p_amount: number; p_user: string }
        Returns: undefined
      }
      catalog_sale_price: { Args: { p_item: string }; Returns: number }
      change_inventory: {
        Args: { p_delta: number; p_item: string; p_user: string }
        Returns: undefined
      }
      farm_action: {
        Args: {
          p_action: string
          p_field?: number
          p_item?: string
          p_quantity?: number
          p_recipe?: string
          p_target?: string
        }
        Returns: string
      }
      trade_action: {
        Args: {
          p_action: string
          p_item?: string
          p_price?: number
          p_quantity?: number
          p_target?: string
        }
        Returns: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
