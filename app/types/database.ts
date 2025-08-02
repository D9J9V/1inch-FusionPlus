
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      swap_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          from_state: string | null
          htlc_hash: string
          id: string
          swap_id: string
          to_state: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          from_state?: string | null
          htlc_hash: string
          id?: string
          swap_id: string
          to_state?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          from_state?: string | null
          htlc_hash?: string
          id?: string
          swap_id?: string
          to_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "swap_events_swap_id_fkey"
            columns: ["swap_id"]
            isOneToOne: false
            referencedRelation: "swaps"
            referencedColumns: ["id"]
          },
        ]
      }
      swaps: {
        Row: {
          amount: string
          btc_amount: number | null
          btc_block_height: number | null
          btc_htlc_address: string | null
          btc_htlc_script: string | null
          btc_tx_id: string | null
          claim_tx_hash: string | null
          confirmations_required: number | null
          created_at: string | null
          current_confirmations: number | null
          error_details: Json | null
          error_message: string | null
          evm_block_number: number | null
          evm_chain_id: number | null
          evm_escrow_address: string | null
          evm_tx_hash: string | null
          expires_at: string
          from_chain: string
          from_token: string
          htlc_hash: string
          id: string
          lightning_invoice: string | null
          lightning_payment_hash: string | null
          lightning_preimage: string | null
          secret: string
          secret_hash: string
          secret_revealed_at: string | null
          secret_revealed_to: string | null
          state: string
          swap_type: string
          timeout_block: number | null
          timeout_timestamp: string | null
          to_chain: string
          to_token: string
          updated_at: string | null
          user_address: string
        }
        Insert: {
          amount: string
          btc_amount?: number | null
          btc_block_height?: number | null
          btc_htlc_address?: string | null
          btc_htlc_script?: string | null
          btc_tx_id?: string | null
          claim_tx_hash?: string | null
          confirmations_required?: number | null
          created_at?: string | null
          current_confirmations?: number | null
          error_details?: Json | null
          error_message?: string | null
          evm_block_number?: number | null
          evm_chain_id?: number | null
          evm_escrow_address?: string | null
          evm_tx_hash?: string | null
          expires_at: string
          from_chain: string
          from_token: string
          htlc_hash: string
          id?: string
          lightning_invoice?: string | null
          lightning_payment_hash?: string | null
          lightning_preimage?: string | null
          secret: string
          secret_hash: string
          secret_revealed_at?: string | null
          secret_revealed_to?: string | null
          state?: string
          swap_type: string
          timeout_block?: number | null
          timeout_timestamp?: string | null
          to_chain: string
          to_token: string
          updated_at?: string | null
          user_address: string
        }
        Update: {
          amount?: string
          btc_amount?: number | null
          btc_block_height?: number | null
          btc_htlc_address?: string | null
          btc_htlc_script?: string | null
          btc_tx_id?: string | null
          claim_tx_hash?: string | null
          confirmations_required?: number | null
          created_at?: string | null
          current_confirmations?: number | null
          error_details?: Json | null
          error_message?: string | null
          evm_block_number?: number | null
          evm_chain_id?: number | null
          evm_escrow_address?: string | null
          evm_tx_hash?: string | null
          expires_at?: string
          from_chain?: string
          from_token?: string
          htlc_hash?: string
          id?: string
          lightning_invoice?: string | null
          lightning_payment_hash?: string | null
          lightning_preimage?: string | null
          secret?: string
          secret_hash?: string
          secret_revealed_at?: string | null
          secret_revealed_to?: string | null
          state?: string
          swap_type?: string
          timeout_block?: number | null
          timeout_timestamp?: string | null
          to_chain?: string
          to_token?: string
          updated_at?: string | null
          user_address?: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
