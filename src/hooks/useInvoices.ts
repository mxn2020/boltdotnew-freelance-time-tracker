// src/hooks/useInvoices.ts

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Invoice, CreateInvoiceData } from '../types/invoices'
import toast from 'react-hot-toast'

export const useInvoices = () => {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvoices = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*),
          project:projects(*),
          line_items:invoice_line_items(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  const createInvoice = async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Create the invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_id: invoiceData.client_id,
          project_id: invoiceData.project_id,
          title: invoiceData.title,
          description: invoiceData.description,
          due_date: invoiceData.due_date,
          tax_rate: invoiceData.tax_rate || 0,
          currency: invoiceData.currency || 'USD',
          notes: invoiceData.notes,
          payment_terms: invoiceData.payment_terms
        })
        .select('*')
        .single()

      if (invoiceError) throw invoiceError

      // Create line items
      if (invoiceData.line_items.length > 0) {
        const lineItemsData = invoiceData.line_items.map(item => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate,
          time_entry_ids: item.time_entry_ids
        }))

        const { error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .insert(lineItemsData)

        if (lineItemsError) throw lineItemsError
      }

      await fetchInvoices()
      toast.success('Invoice created successfully!')
      return invoice
    } catch (err: any) {
      toast.error('Failed to create invoice')
      throw err
    }
  }

  const updateInvoice = async (id: string, updates: Partial<CreateInvoiceData>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await fetchInvoices()
      toast.success('Invoice updated successfully!')
    } catch (err: any) {
      toast.error('Failed to update invoice')
      throw err
    }
  }

  const deleteInvoice = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) throw error

      setInvoices(prev => prev.filter(i => i.id !== id))
      toast.success('Invoice deleted successfully!')
    } catch (err: any) {
      toast.error('Failed to delete invoice')
      throw err
    }
  }

  const updateInvoiceStatus = async (id: string, status: Invoice['status']): Promise<void> => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      await fetchInvoices()
      toast.success(`Invoice marked as ${status}`)
    } catch (err: any) {
      toast.error('Failed to update invoice status')
      throw err
    }
  }

  const generateInvoiceFromTimeEntries = async (
    timeEntryIds: string[],
    clientId?: string,
    projectId?: string
  ): Promise<CreateInvoiceData> => {
    try {
      const { data: timeEntries, error } = await supabase
        .from('time_entries')
        .select(`
          *,
          project:projects(
            *,
            client:clients(*)
          )
        `)
        .in('id', timeEntryIds)
        .eq('user_id', user!.id)

      if (error) throw error

      // Group time entries by project and rate
      const groupedEntries = timeEntries.reduce((groups: any, entry) => {
        const rate = entry.hourly_rate || entry.project?.hourly_rate || user?.hourly_rate || 0
        const key = `${entry.project_id}-${rate}`
        
        if (!groups[key]) {
          groups[key] = {
            project: entry.project,
            rate,
            entries: [],
            totalSeconds: 0
          }
        }
        
        groups[key].entries.push(entry)
        groups[key].totalSeconds += entry.duration || 0
        return groups
      }, {})

      // Create line items
      const lineItems = Object.values(groupedEntries).map((group: any) => ({
        description: `${group.project?.name || 'Time Tracking'} - ${group.entries.length} entries`,
        quantity: group.totalSeconds / 3600, // Convert to hours
        rate: group.rate,
        time_entry_ids: group.entries.map((e: any) => e.id)
      }))

      // Determine client and project
      const firstEntry = timeEntries[0]
      const invoiceClientId = clientId || firstEntry?.project?.client_id
      const invoiceProjectId = projectId || firstEntry?.project_id

      return {
        client_id: invoiceClientId,
        project_id: invoiceProjectId,
        title: `Invoice for ${firstEntry?.project?.name || 'Time Tracking'}`,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        line_items: lineItems
      }
    } catch (err: any) {
      toast.error('Failed to generate invoice from time entries')
      throw err
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [user])

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    generateInvoiceFromTimeEntries
  }
}