//src/types/projects.ts

export interface Client {
  id: string
  user_id: string
  name: string
  email?: string
  company?: string
  phone?: string
  address?: string
  hourly_rate?: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  client_id?: string
  name: string
  description?: string
  hourly_rate?: number
  budget?: number
  status: 'active' | 'completed' | 'paused' | 'archived'
  created_at: string
  updated_at: string
  client?: Client
}

export interface TimeEntry {
  id: string
  user_id: string
  project_id: string
  description?: string
  start_time: string
  end_time?: string
  duration?: number
  is_billable: boolean
  hourly_rate?: number
  tags?: string[]
  created_at: string
  updated_at: string
  project?: Project
}

export interface CreateClientData {
  name: string
  email?: string
  company?: string
  phone?: string
  address?: string
  hourly_rate?: number
}

export interface CreateProjectData {
  name: string
  client_id?: string
  description?: string
  hourly_rate?: number
  budget?: number
  status?: 'active' | 'completed' | 'paused' | 'archived'
}

export interface CreateTimeEntryData {
  project_id: string
  description?: string
  start_time: string
  end_time?: string
  is_billable?: boolean
  hourly_rate?: number
  tags?: string[]
}

export interface UpdateTimeEntryData {
  description?: string
  start_time?: string
  end_time?: string
  is_billable?: boolean
  hourly_rate?: number
  tags?: string[]
}