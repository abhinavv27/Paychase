export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DbResult<T = unknown> = { data: T | null; error: { code?: string; message?: string } | null }
export type DbSingleResult = DbResult
export type DbVoidResult = { error: { code?: string; message?: string } | null }

export interface DbSelectEqChain {
  single(): Promise<DbSingleResult>
  order(col: string, opts: unknown): Promise<DbSingleResult>
  eq(col: string, val: unknown): DbSelectEqChain
  neq(col: string, val: unknown): DbSelectEqChain
  ilike(col: string, val: string): DbSelectEqChain
}

export interface DbSelectChain {
  eq(col: string, val: unknown): DbSelectEqChain
  ilike(col: string, val: string): { single(): Promise<DbSingleResult> }
  order(col: string, opts: unknown): Promise<DbSingleResult>
  lt(col: string, val: unknown): Promise<DbSingleResult>
}

export interface DbUpdateEqChain extends Promise<DbVoidResult> {
  eq(col: string, val: unknown): DbUpdateEqChain
  neq(col: string, val: unknown): DbUpdateEqChain
}

export interface DbUpdateChain {
  eq(col: string, val: unknown): DbUpdateEqChain
}

export interface DbInsertResult extends Promise<DbVoidResult> {
  select(cols: string): { single(): Promise<DbSingleResult> }
}

export interface DbTable {
  select(cols: string): DbSelectChain
  insert(data: Record<string, unknown> | Record<string, unknown>[]): DbInsertResult
  update(data: Record<string, unknown>): DbUpdateChain
}

export interface DbClient {
  from(table: string): DbTable
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          company_name: string | null
          plan: string
          style_preference: 'casual' | 'professional' | 'formal'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone?: string | null
          company_name?: string | null
          plan?: string
          style_preference?: 'casual' | 'professional' | 'formal'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          company_name?: string | null
          plan?: string
          style_preference?: 'casual' | 'professional' | 'formal'
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string | null
          email: string | null
          industry: string | null
          avg_payment_delay_days: number
          on_time_rate: number
          total_invoices: number
          total_paid: number
          total_outstanding: number
          risk_score: number
          preferred_language: string
          preferred_channel: string
          optimal_send_hour: number
          consent_given: boolean
          consent_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone?: string | null
          email?: string | null
          industry?: string | null
          avg_payment_delay_days?: number
          on_time_rate?: number
          total_invoices?: number
          total_paid?: number
          total_outstanding?: number
          risk_score?: number
          preferred_language?: string
          preferred_channel?: string
          optimal_send_hour?: number
          consent_given?: boolean
          consent_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          industry?: string | null
          avg_payment_delay_days?: number
          on_time_rate?: number
          total_invoices?: number
          total_paid?: number
          total_outstanding?: number
          risk_score?: number
          preferred_language?: string
          preferred_channel?: string
          optimal_send_hour?: number
          consent_given?: boolean
          consent_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          client_id: string
          invoice_number: string
          amount: number
          currency: string
          issue_date: string
          due_date: string
          status: string
          paid_amount: number
          payment_date: string | null
          payment_method: string | null
          upi_link: string | null
          reminder_count: number
          last_reminder_sent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          invoice_number: string
          amount: number
          currency?: string
          issue_date: string
          due_date: string
          status?: string
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          upi_link?: string | null
          reminder_count?: number
          last_reminder_sent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          invoice_number?: string
          amount?: number
          currency?: string
          issue_date?: string
          due_date?: string
          status?: string
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          upi_link?: string | null
          reminder_count?: number
          last_reminder_sent?: string | null
          created_at?: string
          updated_at?: string
        }
      }
       reminders: {
         Row: {
           id: string
           user_id: string
           invoice_id: string
           client_id: string
           channel: string
           template_type: string
           message_text: string
           language: string
           sent_at: string | null
           delivered_at: string | null
           read_at: string | null
           responded_at: string | null
           scheduled_send_at: string | null
           status: string
           whatsapp_message_id: string | null
           error_message: string | null
           created_at: string
           approval_status: string
           sent_method: string | null
           user_edited: boolean
         }
         Insert: {
           id?: string
           user_id: string
           invoice_id: string
           client_id: string
           channel: string
           template_type: string
           message_text: string
           language?: string
           sent_at?: string | null
           delivered_at?: string | null
           read_at?: string | null
           responded_at?: string | null
           scheduled_send_at?: string | null
           status?: string
           whatsapp_message_id?: string | null
           error_message?: string | null
           created_at?: string
           approval_status?: string
           sent_method?: string | null
           user_edited?: boolean
         }
         Update: {
           id?: string
           user_id?: string
           invoice_id?: string
           client_id?: string
           channel?: string
           template_type?: string
           message_text?: string
           language?: string
           sent_at?: string | null
           delivered_at?: string | null
           read_at?: string | null
           responded_at?: string | null
           scheduled_send_at?: string | null
           status?: string
           whatsapp_message_id?: string | null
           error_message?: string | null
           created_at?: string
           approval_status?: string
           sent_method?: string | null
           user_edited?: boolean
         }
       }
      payments: {
        Row: {
          id: string
          user_id: string
          invoice_id: string
          client_id: string
          amount: number
          currency: string
          method: string
          razorpay_payment_id: string | null
          razorpay_order_id: string | null
          razorpay_signature: string | null
          status: string
          captured_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          invoice_id: string
          client_id: string
          amount: number
          currency?: string
          method: string
          razorpay_payment_id?: string | null
          razorpay_order_id?: string | null
          razorpay_signature?: string | null
          status?: string
          captured_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          invoice_id?: string
          client_id?: string
          amount?: number
          currency?: string
          method?: string
          razorpay_payment_id?: string | null
          razorpay_order_id?: string | null
          razorpay_signature?: string | null
          status?: string
          captured_at?: string
          created_at?: string
        }
      }
      ai_predictions: {
        Row: {
          id: string
          user_id: string
          client_id: string
          invoice_id: string
          predicted_payment_date: string | null
          predicted_late_probability: number | null
          confidence_interval_low: string | null
          confidence_interval_high: string | null
          model_version: string
          features_used: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          invoice_id: string
          predicted_payment_date?: string | null
          predicted_late_probability?: number | null
          confidence_interval_low?: string | null
          confidence_interval_high?: string | null
          model_version?: string
          features_used?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          invoice_id?: string
          predicted_payment_date?: string | null
          predicted_late_probability?: number | null
          confidence_interval_low?: string | null
          confidence_interval_high?: string | null
          model_version?: string
          features_used?: Json | null
          created_at?: string
        }
      }
      consent_log: {
        Row: {
          id: string
          user_id: string
          client_phone: string | null
          client_email: string | null
          consent_type: string
          consent_given: boolean
          consent_timestamp: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          user_id: string
          client_phone?: string | null
          client_email?: string | null
          consent_type: string
          consent_given: boolean
          consent_timestamp?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          client_phone?: string | null
          client_email?: string | null
          consent_type?: string
          consent_given?: boolean
          consent_timestamp?: string
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      audit_log: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
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
  }
}
