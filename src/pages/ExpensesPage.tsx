// src/pages/ExpensesPage.tsx
import React, { useState } from 'react'
import { useExpenses } from '../hooks/useExpenses'
import { ExpenseForm } from '../components/expenses/ExpenseForm'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Plus, Receipt, DollarSign, TrendingUp, Edit, Trash2 } from 'lucide-react'
import { Expense, CreateExpenseData } from '../types/invoices'
import { formatCurrency } from '../utils/timeUtils'
import { format } from 'date-fns'

export const ExpensesPage: React.FC = () => {
  const { 
    expenses, 
    loading, 
    createExpense, 
    updateExpense, 
    deleteExpense,
    getExpenseStats 
  } = useExpenses()
  
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const handleCreateExpense = async (data: CreateExpenseData) => {
    await createExpense(data)
    setShowForm(false)
  }

  const handleUpdateExpense = async (data: CreateExpenseData) => {
    if (editingExpense) {
      await updateExpense(editingExpense.id, data)
      setEditingExpense(null)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setShowForm(true)
  }

  const handleDeleteExpense = async (expense: Expense) => {
    if (window.confirm(`Are you sure you want to delete this expense?`)) {
      await deleteExpense(expense.id)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingExpense(null)
  }

  const stats = getExpenseStats()

  const getCategoryLabel = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </h1>
        </div>

        <ExpenseForm
          expense={editingExpense || undefined}
          onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense}
          onCancel={handleCancelForm}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Track and manage your business expenses</p>
        </div>
        <Button
          icon={Plus}
          onClick={() => setShowForm(true)}
        >
          Add Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.totalExpenses)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Billable</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.billableExpenses)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Receipt className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Reimbursable</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.reimbursableExpenses)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Receipt className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Count</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.expenseCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading expenses...</p>
        </div>
      ) : expenses.length === 0 ? (
        <Card className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
          <p className="text-gray-500 mb-4">Start tracking your business expenses</p>
          <Button
            icon={Plus}
            onClick={() => setShowForm(true)}
          >
            Add Expense
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Project</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {expense.description}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {getCategoryLabel(expense.category)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {expense.project?.name || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex space-x-1">
                        {expense.is_billable && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            Billable
                          </span>
                        )}
                        {expense.is_reimbursable && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            Reimbursable
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit}
                          onClick={() => handleEditExpense(expense)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteExpense(expense)}
                          className="text-red-600 hover:text-red-700"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}