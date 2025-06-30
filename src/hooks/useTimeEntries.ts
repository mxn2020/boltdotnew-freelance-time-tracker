import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TimeEntry, CreateTimeEntryData, UpdateTimeEntryData } from '../types/projects'
import toast from 'react-hot-toast'

export const useTimeEntries = (projectId?: string) => {
  const { user } = useAuth()
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTimeEntries = async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          project:projects(
            *,
            client:clients(*)
          )
        `)
        .eq('user_id', user.id)

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query.order('start_time', { ascending: false })

      if (error) throw error
      setTimeEntries(data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching time entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const createTimeEntry = async (entryData: CreateTimeEntryData): Promise<TimeEntry> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ...entryData,
          user_id: user.id,
          is_billable: entryData.is_billable ?? true
        })
        .select(`
          *,
          project:projects(
            *,
            client:clients(*)
          )
        `)
        .single()

      if (error) throw error

      setTimeEntries(prev => [data, ...prev])
      toast.success('Time entry created successfully!')
      return data
    } catch (err: any) {
      toast.error('Failed to create time entry')
      throw err
    }
  }

  const updateTimeEntry = async (id: string, updates: UpdateTimeEntryData): Promise<void> => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await fetchTimeEntries()
      toast.success('Time entry updated successfully!')
    } catch (err: any) {
      toast.error('Failed to update time entry')
      throw err
    }
  }

  const deleteTimeEntry = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTimeEntries(prev => prev.filter(e => e.id !== id))
      toast.success('Time entry deleted successfully!')
    } catch (err: any) {
      toast.error('Failed to delete time entry')
      throw err
    }
  }

  useEffect(() => {
    fetchTimeEntries()
  }, [user, projectId])

  return {
    timeEntries,
    loading,
    error,
    fetchTimeEntries,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry
  }
}