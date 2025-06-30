export interface User {
  id: string
  email: string
  full_name: string
  business_name?: string
  timezone: string
  hourly_rate: number
  profile_photo_url?: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  full_name: string
  business_name?: string
  timezone: string
  hourly_rate: number
}