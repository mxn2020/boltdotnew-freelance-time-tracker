// src/components/expenses/ExpenseForm.tsx
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreateExpenseData, Expense } from '../../types/invoices'
import { useClients } from '../../hooks/useClients'
import { useProjects } from '../../hooks/useProjects'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader, CardTitle } from '../ui/Card'

const expenseSchema = z.object({
  project_id: z.string().optional(),
  client_id: z.string().optional(),
  category: z.enum([
    'office_supplies', 'software', 'hardware', 'travel', 'meals',
    'marketing', 'professional_services', 'utilities', 'rent', 'other'
  ]),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().optional(),
  expense_date: z.string().min(1, 'Expense date is required'),
  is_billable: z.boolean().optional(),
  is_reimbursable: z.boolean().optional(),
  tax_category: z.string().optional(),
  notes: z.string().optional()
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  expense?: Expense
  onSubmit: (data: CreateExpenseData) => Promise<void>
  onCancel: () => void
}

const EXPENSE_CATEGORIES = [
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'rent', label: 'Rent' },
  { value: 'other', label: 'Other' }
]

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  expense,
  onSubmit,
  onCancel
}) => {
  const { clients } = useClients()
  const { projects } = useProjects()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense ? {
      project_id: expense.project_id || '',
      client_id: expense.client_id || '',
      category: expense.category as any,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      expense_date: expense.expense_date,
      is_billable: expense.is_billable,
      is_reimbursable: expense.is_reimbursable,
      tax_category: expense.tax_category || '',
      notes: expense.notes || ''
    } : {
      expense_date: new Date().toISOString().split('T')[0],
      currency: 'USD',
      is_billable: false,
      is_reimbursable: false
    }
  })

  const handleFormSubmit = async (data: ExpenseFormData) => {
    try {
      const submitData: CreateExpenseData = {
        ...data,
        project_id: data.project_id || undefined,
        client_id: data.client_id || undefined,
        currency: data.currency || 'USD',
        tax_category: data.tax_category || undefined,
        notes: data.notes || undefined
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {expense ? 'Edit Expense' : 'Add New Expense'}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('category')}
            >
              {EXPENSE_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
            )}
          </div>

          <Input
            label="Expense Date"
            type="date"
            error={errors.expense_date?.message}
            {...register('expense_date')}
          />
        </div>

        <Input
          label="Description"
          placeholder="Enter expense description"
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
          />

          <Input
            label="Currency"
            placeholder="USD"
            error={errors.currency?.message}
            {...register('currency')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project (Optional)
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('project_id')}
            >
              <option value="">No project assigned</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client (Optional)
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('client_id')}
            >
              <option value="">No client assigned</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.company && `(${client.company})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_billable"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...register('is_billable')}
              />
              <label htmlFor="is_billable" className="ml-2 text-sm font-medium text-gray-700">
                Billable to client
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_reimbursable"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...register('is_reimbursable')}
              />
              <label htmlFor="is_reimbursable" className="ml-2 text-sm font-medium text-gray-700">
                Reimbursable
              </label>
            </div>
          </div>

          <Input
            label="Tax Category (Optional)"
            placeholder="e.g., Business Expense"
            error={errors.tax_category?.message}
            {...register('tax_category')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional notes..."
            {...register('notes')}
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            loading={isSubmitting}
            className="flex-1"
          >
            {expense ? 'Update Expense' : 'Add Expense'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}