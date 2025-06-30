// src/hooks/useClients.ts

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Client, CreateClientData } from '../types/projects'
import toast from 'react-hot-toast'

export const useClients = () => {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching clients:', err)
    } finally {
      setLoading(false)
    }
  }

  const createClient = async (clientData: CreateClientData): Promise<Client> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          ...clientData,
          user_id: user.id
        })
        .select('*')
        .single()

      if (error) throw error

      setClients(prev => [data, ...prev])
      toast.success('Client created successfully!')
      return data
    } catch (err: any) {
      toast.error('Failed to create client')
      throw err
    }
  }

  const updateClient = async (id: string, updates: Partial<CreateClientData>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await fetchClients()
      toast.success('Client updated successfully!')
    } catch (err: any) {
      toast.error('Failed to update client')
      throw err
    }
  }

  const deleteClient = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error

      setClients(prev => prev.filter(c => c.id !== id))
      toast.success('Client deleted successfully!')
    } catch (err: any) {
      toast.error('Failed to delete client')
      throw err
    }
  }

  useEffect(() => {
    fetchClients()
  }, [user])

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient
  }
}