// src/hooks/useGoals.ts

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Goal, CreateGoalData } from '../types/analytics'
import toast from 'react-hot-toast'

export const useGoals = () => {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGoals(data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching goals:', err)
    } finally {
      setLoading(false)
    }
  }

  const createGoal = async (goalData: CreateGoalData): Promise<Goal> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goalData,
          user_id: user.id
        })
        .select('*')
        .single()

      if (error) throw error

      setGoals(prev => [data, ...prev])
      toast.success('Goal created successfully!')
      return data
    } catch (err: any) {
      toast.error('Failed to create goal')
      throw err
    }
  }

  const updateGoal = async (id: string, updates: Partial<CreateGoalData>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await fetchGoals()
      toast.success('Goal updated successfully!')
    } catch (err: any) {
      toast.error('Failed to update goal')
      throw err
    }
  }

  const deleteGoal = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)

      if (error) throw error

      setGoals(prev => prev.filter(g => g.id !== id))
      toast.success('Goal deleted successfully!')
    } catch (err: any) {
      toast.error('Failed to delete goal')
      throw err
    }
  }

  const updateGoalStatus = async (id: string, status: Goal['status']): Promise<void> => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      await fetchGoals()
      toast.success(`Goal marked as ${status}`)
    } catch (err: any) {
      toast.error('Failed to update goal status')
      throw err
    }
  }

  const recalculateGoalProgress = async (goalId: string): Promise<void> => {
    try {
      // Trigger the goal progress calculation by updating the goal
      const { error } = await supabase
        .from('goals')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', goalId)

      if (error) throw error

      await fetchGoals()
    } catch (err: any) {
      console.error('Failed to recalculate goal progress:', err)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [user])

  return {
    goals,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    updateGoalStatus,
    recalculateGoalProgress
  }
}