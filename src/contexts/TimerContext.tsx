import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { TimeEntry, Project } from '../types/projects'
import toast from 'react-hot-toast'

interface TimerState {
  activeEntry: TimeEntry | null
  isRunning: boolean
  elapsedTime: number
  selectedProject: Project | null
}

interface TimerContextType extends TimerState {
  startTimer: (projectId: string, description?: string) => Promise<void>
  stopTimer: () => Promise<void>
  pauseTimer: () => Promise<void>
  resumeTimer: () => Promise<void>
  setSelectedProject: (project: Project | null) => void
  refreshActiveTimer: () => Promise<void>
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export const useTimer = () => {
  const context = useContext(TimerContext)
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider')
  }
  return context
}

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [state, setState] = useState<TimerState>({
    activeEntry: null,
    isRunning: false,
    elapsedTime: 0,
    selectedProject: null
  })

  // Update elapsed time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (state.isRunning && state.activeEntry) {
      interval = setInterval(() => {
        const startTime = new Date(state.activeEntry!.start_time).getTime()
        const now = Date.now()
        const elapsed = Math.floor((now - startTime) / 1000)
        setState(prev => ({ ...prev, elapsedTime: elapsed }))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [state.isRunning, state.activeEntry])

  // Check for active timer on mount and user change
  const refreshActiveTimer = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          project:projects(
            *,
            client:clients(*)
          )
        `)
        .eq('user_id', user.id)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        const startTime = new Date(data.start_time).getTime()
        const now = Date.now()
        const elapsed = Math.floor((now - startTime) / 1000)

        setState(prev => ({
          ...prev,
          activeEntry: data,
          isRunning: true,
          elapsedTime: elapsed,
          selectedProject: data.project
        }))
      } else {
        setState(prev => ({
          ...prev,
          activeEntry: null,
          isRunning: false,
          elapsedTime: 0
        }))
      }
    } catch (error) {
      console.error('Error fetching active timer:', error)
    }
  }, [user])

  useEffect(() => {
    refreshActiveTimer()
  }, [refreshActiveTimer])

  const startTimer = async (projectId: string, description?: string) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Stop any existing active timer first
      if (state.activeEntry) {
        await stopTimer()
      }

      const startTime = new Date().toISOString()

      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user.id,
          project_id: projectId,
          description: description || '',
          start_time: startTime,
          is_billable: true
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

      setState(prev => ({
        ...prev,
        activeEntry: data,
        isRunning: true,
        elapsedTime: 0,
        selectedProject: data.project
      }))

      toast.success('Timer started!')
    } catch (error: any) {
      toast.error('Failed to start timer')
      throw error
    }
  }

  const stopTimer = async () => {
    if (!state.activeEntry) return

    try {
      const endTime = new Date().toISOString()

      const { error } = await supabase
        .from('time_entries')
        .update({ end_time: endTime })
        .eq('id', state.activeEntry.id)

      if (error) throw error

      setState(prev => ({
        ...prev,
        activeEntry: null,
        isRunning: false,
        elapsedTime: 0
      }))

      toast.success('Timer stopped!')
    } catch (error: any) {
      toast.error('Failed to stop timer')
      throw error
    }
  }

  const pauseTimer = async () => {
    // For now, pause is the same as stop - we can enhance this later
    await stopTimer()
  }

  const resumeTimer = async () => {
    if (!state.selectedProject) return
    await startTimer(state.selectedProject.id, state.activeEntry?.description)
  }

  const setSelectedProject = (project: Project | null) => {
    setState(prev => ({ ...prev, selectedProject: project }))
  }

  const value: TimerContextType = {
    ...state,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    setSelectedProject,
    refreshActiveTimer
  }

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  )
}