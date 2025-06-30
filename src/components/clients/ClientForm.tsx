import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreateClientData, Client } from '../../types/projects'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader, CardTitle } from '../ui/Card'

const clientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  hourly_rate: z.number().min(0, 'Hourly rate must be positive').optional()
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormProps {
  client?: Client
  onSubmit: (data: CreateClientData) => Promise<void>
  onCancel: () => void
}

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  onCancel
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? {
      name: client.name,
      email: client.email || '',
      company: client.company || '',
      phone: client.phone || '',
      address: client.address || '',
      hourly_rate: client.hourly_rate || undefined
    } : {}
  })

  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      const submitData: CreateClientData = {
        ...data,
        email: data.email || undefined,
        hourly_rate: data.hourly_rate || undefined
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
          {client ? 'Edit Client' : 'Add New Client'}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Input
          label="Client Name"
          placeholder="Enter client name"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email (Optional)"
          type="email"
          placeholder="client@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Company (Optional)"
          placeholder="Company name"
          error={errors.company?.message}
          {...register('company')}
        />

        <Input
          label="Phone (Optional)"
          placeholder="Phone number"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address (Optional)
          </label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Client address..."
            {...register('address')}
          />
          {errors.address && (
            <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
          )}
        </div>

        <Input
          label="Hourly Rate (Optional)"
          type="number"
          step="0.01"
          placeholder="0.00"
          error={errors.hourly_rate?.message}
          {...register('hourly_rate', { valueAsNumber: true })}
        />

        <div className="flex gap-4">
          <Button
            type="submit"
            loading={isSubmitting}
            className="flex-1"
          >
            {client ? 'Update Client' : 'Add Client'}
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