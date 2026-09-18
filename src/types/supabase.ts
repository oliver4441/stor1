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
      listings: {
        Row: {
          id: string
          title: string
          description: string | null
          price: number
          compare_at_price: number | null
          quantity: number
          status: string
          seller_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          price: number
          compare_at_price?: number | null
          quantity?: number
          status?: string
          seller_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          price?: number
          compare_at_price?: number | null
          quantity?: number
          status?: string
          seller_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      omix_orders: {
        Row: {
          id: string
          user_id: string
          status: string
          total_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          total_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          total_amount?: number
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string | null
          loyalty_points: number
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string | null
          loyalty_points?: number
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string | null
          loyalty_points?: number
          created_at?: string
        }
      }
    }
  }
}
