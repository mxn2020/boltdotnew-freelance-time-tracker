// src/hooks/useProductivityInsights.ts

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ProductivityInsight } from '../types/analytics'
import toast from 'react-hot-toast'

export const useProductivityInsights = () => {
  const { user } = useAuth()
  const [insights, setInsights] = useState<ProductivityInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('productivity_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setInsights(data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching insights:', err)
    } finally {
      setLoading(false)
    }
  }

  const markInsightAsRead = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('productivity_insights')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error

      setInsights(prev => prev.map(insight => 
        insight.id === id ? { ...insight, is_read: true } : insight
      ))
    } catch (err: any) {
      console.error('Failed to mark insight as read:', err)
    }
  }

  const markAllInsightsAsRead = async (): Promise<void> => {
    try {
      const { error } = await supabase
        .from('productivity_insights')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false)

      if (error) throw error

      setInsights(prev => prev.map(insight => ({ ...insight, is_read: true })))
      toast.success('All insights marked as read')
    } catch (err: any) {
      toast.error('Failed to mark insights as read')
    }
  }

  const generateInsights = async (): Promise<void> => {
    if (!user) return

    try {
      // Call the stored procedure to generate insights
      const { error } = await supabase.rpc('generate_productivity_insights', {
        user_uuid: user.id
      })

      if (error) throw error

      await fetchInsights()
      toast.success('Productivity insights updated!')
    } catch (err: any) {
      toast.error('Failed to generate insights')
      console.error('Error generating insights:', err)
    }
  }

  const dismissInsight = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('productivity_insights')
        .delete()
        .eq('id', id)

      if (error) throw error

      setInsights(prev => prev.filter(insight => insight.id !== id))
    } catch (err: any) {
      console.error('Failed to dismiss insight:', err)
    }
  }

  const getUnreadCount = (): number => {
    return insights.filter(insight => !insight.is_read).length
  }

  const getInsightsByType = (type: ProductivityInsight['type']): ProductivityInsight[] => {
    return insights.filter(insight => insight.type === type)
  }

  const getHighImpactInsights = (): ProductivityInsight[] => {
    return insights.filter(insight => insight.impact === 'high' && !insight.is_read)
  }

  useEffect(() => {
    fetchInsights()
  }, [user])

  return {
    insights,
    loading,
    error,
    fetchInsights,
    markInsightAsRead,
    markAllInsightsAsRead,
    generateInsights,
    dismissInsight,
    getUnreadCount,
    getInsightsByType,
    getHighImpactInsights
  }
}