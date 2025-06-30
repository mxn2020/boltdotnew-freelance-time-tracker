export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          business_name: string | null
          timezone: string
          hourly_rate: number
          profile_photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          business_name?: string | null
          timezone: string
          hourly_rate: number
          profile_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          business_name?: string | null
          timezone?: string
          hourly_rate?: number
          profile_photo_url?: string | null
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          company: string | null
          phone: string | null
          address: string | null
          hourly_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          company?: string | null
          phone?: string | null
          address?: string | null
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          company?: string | null
          phone?: string | null
          address?: string | null
          hourly_rate?: number | null
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          name: string
          description: string | null
          hourly_rate: number | null
          budget: number | null
          status: 'active' | 'completed' | 'paused' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          name: string
          description?: string | null
          hourly_rate?: number | null
          budget?: number | null
          status?: 'active' | 'completed' | 'paused' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          name?: string
          description?: string | null
          hourly_rate?: number | null
          budget?: number | null
          status?: 'active' | 'completed' | 'paused' | 'archived'
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          project_id: string
          description: string | null
          start_time: string
          end_time: string | null
          duration: number | null
          is_billable: boolean
          hourly_rate: number | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          description?: string | null
          start_time: string
          end_time?: string | null
          duration?: number | null
          is_billable?: boolean
          hourly_rate?: number | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          description?: string | null
          start_time?: string
          end_time?: string | null
          duration?: number | null
          is_billable?: boolean
          hourly_rate?: number | null
          tags?: string[] | null
          updated_at?: string
        }
      }
    }
  }
}