export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      users: {
        Row: {
          id: string
          company_id: string | null
          role: 'super_admin' | 'company_admin'
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id: string
          company_id?: string | null
          role: 'super_admin' | 'company_admin'
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string | null
          role?: 'super_admin' | 'company_admin'
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      items: {
        Row: {
          id: string
          company_id: string
          name: string
          price: number
          is_active: boolean
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
          deleted_at: string | null
          deleted_by: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          price: number
          is_active?: boolean
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          price?: number
          is_active?: boolean
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          company_id: string
          total_amount: number
          payment_type: 'cash' | 'touch_n_go'
          status: 'paid' | 'refunded'
          created_at: string
          created_by: string | null
          refunded_at: string | null
          refunded_by: string | null
        }
        Insert: {
          id?: string
          company_id: string
          total_amount: number
          payment_type: 'cash' | 'touch_n_go'
          status?: 'paid' | 'refunded'
          created_at?: string
          created_by?: string | null
          refunded_at?: string | null
          refunded_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          total_amount?: number
          payment_type?: 'cash' | 'touch_n_go'
          status?: 'paid' | 'refunded'
          created_at?: string
          created_by?: string | null
          refunded_at?: string | null
          refunded_by?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          item_id: string | null
          item_name_snapshot: string
          item_price_snapshot: number
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          item_id?: string | null
          item_name_snapshot: string
          item_price_snapshot: number
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          item_id?: string | null
          item_name_snapshot?: string
          item_price_snapshot?: number
          quantity?: number
          created_at?: string
        }
      }
    }
  }
}
