// src/hooks/useExpenses.ts

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Expense, CreateExpenseData } from '../types/invoices'
import toast from 'react-hot-toast'

export const useExpenses = () => {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExpenses = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          project:projects(*),
          client:clients(*)
        `)
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching expenses:', err)
    } finally {
      setLoading(false)
    }
  }

  const createExpense = async (expenseData: CreateExpenseData): Promise<Expense> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          user_id: user.id,
          currency: expenseData.currency || 'USD',
          is_billable: expenseData.is_billable ?? false,
          is_reimbursable: expenseData.is_reimbursable ?? false
        })
        .select(`
          *,
          project:projects(*),
          client:clients(*)
        `)
        .single()

      if (error) throw error

      setExpenses(prev => [data, ...prev])
      toast.success('Expense created successfully!')
      return data
    } catch (err: any) {
      toast.error('Failed to create expense')
      throw err
    }
  }

  const updateExpense = async (id: string, updates: Partial<CreateExpenseData>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await fetchExpenses()
      toast.success('Expense updated successfully!')
    } catch (err: any) {
      toast.error('Failed to update expense')
      throw err
    }
  }

  const deleteExpense = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error

      setExpenses(prev => prev.filter(e => e.id !== id))
      toast.success('Expense deleted successfully!')
    } catch (err: any) {
      toast.error('Failed to delete expense')
      throw err
    }
  }

  const getExpensesByCategory = () => {
    return expenses.reduce((categories, expense) => {
      const category = expense.category
      if (!categories[category]) {
        categories[category] = {
          total: 0,
          count: 0,
          expenses: []
        }
      }
      categories[category].total += expense.amount
      categories[category].count += 1
      categories[category].expenses.push(expense)
      return categories
    }, {} as Record<string, { total: number; count: number; expenses: Expense[] }>)
  }

  const getExpenseStats = () => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const billableExpenses = expenses
      .filter(expense => expense.is_billable)
      .reduce((sum, expense) => sum + expense.amount, 0)
    const reimbursableExpenses = expenses
      .filter(expense => expense.is_reimbursable)
      .reduce((sum, expense) => sum + expense.amount, 0)

    return {
      totalExpenses,
      billableExpenses,
      reimbursableExpenses,
      expenseCount: expenses.length
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [user])

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    getExpenseStats
  }
}