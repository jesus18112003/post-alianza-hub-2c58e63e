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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_details: {
        Row: {
          agent_id: string
          created_at: string
          date_of_birth: string | null
          id: string
          personal_email: string | null
          secondary_email: string | null
          ssn: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          date_of_birth?: string | null
          id?: string
          personal_email?: string | null
          secondary_email?: string | null
          ssn?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          date_of_birth?: string | null
          id?: string
          personal_email?: string | null
          secondary_email?: string | null
          ssn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      agent_portal_credentials: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          portal_name: string
          portal_password: string
          portal_username: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          portal_name: string
          portal_password: string
          portal_username: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          portal_name?: string
          portal_password?: string
          portal_username?: string
        }
        Relationships: []
      }
      agent_producer_numbers: {
        Row: {
          agent_id: string
          company: string
          created_at: string
          id: string
          producer_number: string
        }
        Insert: {
          agent_id: string
          company: string
          created_at?: string
          id?: string
          producer_number: string
        }
        Update: {
          agent_id?: string
          company?: string
          created_at?: string
          id?: string
          producer_number?: string
        }
        Relationships: []
      }
      carrier_totals_access: {
        Row: {
          agent_id: string
          enabled: boolean
          updated_at: string
        }
        Insert: {
          agent_id: string
          enabled?: boolean
          updated_at?: string
        }
        Update: {
          agent_id?: string
          enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      carrier_totals_carriers: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          name: string
          position: number
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          name: string
          position?: number
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: []
      }
      carrier_totals_entries: {
        Row: {
          agent_id: string
          amount: number
          carrier_id: string
          created_at: string
          entry_date: string
          id: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          amount?: number
          carrier_id: string
          created_at?: string
          entry_date: string
          id?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          amount?: number
          carrier_id?: string
          created_at?: string
          entry_date?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carrier_totals_entries_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carrier_totals_carriers"
            referencedColumns: ["id"]
          },
        ]
      }
      closing_assignments: {
        Row: {
          amount: number | null
          assigned_agent_id: string | null
          client_name: string | null
          company: string | null
          created_at: string
          created_policy_id: string | null
          discord_message_id: string
          id: string
          location: string | null
          payment_method: string | null
          policy_type: string | null
          raw_message: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          assigned_agent_id?: string | null
          client_name?: string | null
          company?: string | null
          created_at?: string
          created_policy_id?: string | null
          discord_message_id: string
          id?: string
          location?: string | null
          payment_method?: string | null
          policy_type?: string | null
          raw_message: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          assigned_agent_id?: string | null
          client_name?: string | null
          company?: string | null
          created_at?: string
          created_policy_id?: string | null
          discord_message_id?: string
          id?: string
          location?: string | null
          payment_method?: string | null
          policy_type?: string | null
          raw_message?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      internal_tasks: {
        Row: {
          archived: boolean
          content: string
          created_at: string
          created_by: string
          id: string
          mentions: string[]
          status: boolean
          updated_at: string
        }
        Insert: {
          archived?: boolean
          content: string
          created_at?: string
          created_by: string
          id?: string
          mentions?: string[]
          status?: boolean
          updated_at?: string
        }
        Update: {
          archived?: boolean
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          mentions?: string[]
          status?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ledger_notes: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          note: string
          policy_id: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          note?: string
          policy_id: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          note?: string
          policy_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          agent_id: string
          created_at: string
          expires_at: string
          id: string
          message: string
          notification_type: string
          policy_id: string
          read: boolean
        }
        Insert: {
          agent_id: string
          created_at?: string
          expires_at: string
          id?: string
          message: string
          notification_type?: string
          policy_id: string
          read?: boolean
        }
        Update: {
          agent_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          message?: string
          notification_type?: string
          policy_id?: string
          read?: boolean
        }
        Relationships: []
      }
      policies: {
        Row: {
          agent_id: string
          agent_premium: number | null
          assignees: string[]
          bank_amount: number | null
          chargeback_amount: number | null
          client_first_name: string | null
          client_last_name: string | null
          client_name: string
          collection_date: string | null
          company: string
          created_at: string
          date: string
          folder_sent_date: string | null
          id: string
          location: string | null
          needs_call_followup: boolean
          notes: string | null
          notes_updated_at: string | null
          payment_method: string | null
          phone_number: string | null
          policy_number: string | null
          policy_type: string | null
          prima_payment: number | null
          scheduled_call_date: string | null
          status: Database["public"]["Enums"]["policy_status"]
          target_premium: number | null
          total_commission: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          agent_premium?: number | null
          assignees?: string[]
          bank_amount?: number | null
          chargeback_amount?: number | null
          client_first_name?: string | null
          client_last_name?: string | null
          client_name: string
          collection_date?: string | null
          company: string
          created_at?: string
          date?: string
          folder_sent_date?: string | null
          id?: string
          location?: string | null
          needs_call_followup?: boolean
          notes?: string | null
          notes_updated_at?: string | null
          payment_method?: string | null
          phone_number?: string | null
          policy_number?: string | null
          policy_type?: string | null
          prima_payment?: number | null
          scheduled_call_date?: string | null
          status?: Database["public"]["Enums"]["policy_status"]
          target_premium?: number | null
          total_commission?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          agent_premium?: number | null
          assignees?: string[]
          bank_amount?: number | null
          chargeback_amount?: number | null
          client_first_name?: string | null
          client_last_name?: string | null
          client_name?: string
          collection_date?: string | null
          company?: string
          created_at?: string
          date?: string
          folder_sent_date?: string | null
          id?: string
          location?: string | null
          needs_call_followup?: boolean
          notes?: string | null
          notes_updated_at?: string | null
          payment_method?: string | null
          phone_number?: string | null
          policy_number?: string | null
          policy_type?: string | null
          prima_payment?: number | null
          scheduled_call_date?: string | null
          status?: Database["public"]["Enums"]["policy_status"]
          target_premium?: number | null
          total_commission?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      policy_followups: {
        Row: {
          created_at: string
          created_by: string
          due_date: string
          id: string
          notify_days_before: number
          policy_id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          due_date: string
          id?: string
          notify_days_before?: number
          policy_id: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          due_date?: string
          id?: string
          notify_days_before?: number
          policy_id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      policy_requirements: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          policy_id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          id?: string
          policy_id: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          policy_id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      welcome_templates: {
        Row: {
          agent_id: string | null
          created_at: string
          id: string
          name: string
          template_text: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          id?: string
          name?: string
          template_text?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          id?: string
          name?: string
          template_text?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_followup_notifications: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent"
      policy_status:
        | "emitido"
        | "cobrado"
        | "pendiente"
        | "fondo_insuficiente"
        | "descalificado"
        | "cancelado"
        | "chargeback"
        | "aprobado"
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
    Enums: {
      app_role: ["admin", "agent"],
      policy_status: [
        "emitido",
        "cobrado",
        "pendiente",
        "fondo_insuficiente",
        "descalificado",
        "cancelado",
        "chargeback",
        "aprobado",
      ],
    },
  },
} as const
