export type Database = {
  public: {
    Tables: {
      grok_credit_accounts: {
        Row: {
          user_id: string;
          balance: number;
          free_questions_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
          free_questions_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          balance?: number;
          free_questions_used?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      grok_guest_allowances: {
        Row: {
          guest_hash: string;
          free_questions_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          guest_hash: string;
          free_questions_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          free_questions_used?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      grok_guest_ip_allowances: {
        Row: {
          ip_hash: string;
          free_questions_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          ip_hash: string;
          free_questions_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          free_questions_used?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      grok_usage_requests: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      grok_credit_ledger: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      reserve_authenticated_grok_usage: {
        Args: {
          p_user_id: string;
          p_request_id: string;
          p_model: string;
          p_reserved_credits: number;
        };
        Returns: Array<{
          allowed: boolean;
          usage_mode: "free" | "credits" | null;
          reason: string | null;
        }>;
      };
      reserve_guest_grok_usage: {
        Args: {
          p_guest_hash: string;
          p_ip_hash: string;
          p_request_id: string;
          p_model: string;
        };
        Returns: Array<{
          allowed: boolean;
          reason: string | null;
        }>;
      };
      release_grok_usage: {
        Args: {
          p_request_id: string;
          p_error_message: string;
        };
        Returns: undefined;
      };
      settle_grok_usage: {
        Args: {
          p_request_id: string;
          p_actual_credits: number;
          p_provider_cost_usd: number;
          p_prompt_tokens: number;
          p_completion_tokens: number;
          p_generation_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
