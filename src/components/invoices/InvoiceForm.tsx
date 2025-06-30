// src/components/invoices/InvoiceForm.tsx
import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreateInvoiceData, CreateInvoiceLineItemData } from '../../types/invoices'
import { useClients } from '../../hooks/useClients'
import { useProjects } from '../../hooks/useProjects'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Plus, Trash2, Calculator } from 'lucide-react'

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  rate: z.number().min(0, 'Rate must be positive')
})

const invoiceSchema = z.object({
  client_id: z.string().optional(),
  project_id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  tax_rate: z.number().min(0).max(100).optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  payment_terms: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, 'At least one line item is required')
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormProps {
  initialData?: Partial<CreateInvoiceData>
  onSubmit: (data: CreateInvoiceData) => Promise<void>
  onCancel: () => void
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const { clients } = useClients()
  const { projects } = useProjects()
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      client_id: initialData?.client_id || '',
      project_id: initialData?.project_id || '',
      due_date: initialData?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tax_rate: initialData?.tax_rate || 0,
      currency: initialData?.currency || 'USD',
      notes: initialData?.notes || '',
      payment_terms: initialData?.payment_terms || 'Net 30',
      line_items: initialData?.line_items || [
        { description: '', quantity: 1, rate: 0 }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'line_items'
  })

  const watchedLineItems = watch('line_items')
  const watchedTaxRate = watch('tax_rate') || 0

  const subtotal = watchedLineItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.rate || 0)
  }, 0)

  const taxAmount = subtotal * (watchedTaxRate / 100)
  const total = subtotal + taxAmount

  const handleFormSubmit = async (data: InvoiceFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const addLineItem = () => {
    append({ description: '', quantity: 1, rate: 0 })
  }

  const removeLineItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit Invoice' : 'Create New Invoice'}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Invoice Title"
            placeholder="Enter invoice title"
            error={errors.title?.message}
            {...register('title')}
          />

          <Input
            label="Due Date"
            type="date"
            error={errors.due_date?.message}
            {...register('due_date')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client (Optional)
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('client_id')}
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} {client.company && `(${client.company})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project (Optional)
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('project_id')}
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Invoice description..."
            {...register('description')}
          />
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={addLineItem}
            >
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-5">
                  <Input
                    placeholder="Description"
                    error={errors.line_items?.[index]?.description?.message}
                    {...register(`line_items.${index}.description`)}
                  />
                </div>
                
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    error={errors.line_items?.[index]?.quantity?.message}
                    {...register(`line_items.${index}.quantity`, { valueAsNumber: true })}
                  />
                </div>
                
                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Rate"
                    error={errors.line_items?.[index]?.rate?.message}
                    {...register(`line_items.${index}.rate`, { valueAsNumber: true })}
                  />
                </div>
                
                <div className="col-span-2">
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-sm font-medium text-gray-900">
                    ${((watchedLineItems[index]?.quantity || 0) * (watchedLineItems[index]?.rate || 0)).toFixed(2)}
                  </div>
                </div>
                
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => removeLineItem(index)}
                    disabled={fields.length === 1}
                    className="text-red-600 hover:text-red-700"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Invoice Totals
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Tax Rate (%)"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.tax_rate?.message}
              {...register('tax_rate', { valueAsNumber: true })}
            />

            <Input
              label="Currency"
              placeholder="USD"
              {...register('currency')}
            />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({watchedTaxRate}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Terms
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('payment_terms')}
            >
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 60">Net 60</option>
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Custom">Custom</option>
            </select>
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
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            loading={isSubmitting}
            className="flex-1"
          >
            {initialData ? 'Update Invoice' : 'Create Invoice'}
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