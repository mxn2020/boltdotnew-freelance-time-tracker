import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreateProjectData, Project } from '../../types/projects'
import { useClients } from '../../hooks/useClients'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader, CardTitle } from '../ui/Card'

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  client_id: z.string().optional(),
  description: z.string().optional(),
  hourly_rate: z.number().min(0, 'Hourly rate must be positive').optional(),
  budget: z.number().min(0, 'Budget must be positive').optional(),
  status: z.enum(['active', 'completed', 'paused', 'archived']).optional()
})

type ProjectFormData = z.infer<typeof projectSchema>

interface ProjectFormProps {
  project?: Project
  onSubmit: (data: CreateProjectData) => Promise<void>
  onCancel: () => void
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  onCancel
}) => {
  const { clients } = useClients()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ? {
      name: project.name,
      client_id: project.client_id || '',
      description: project.description || '',
      hourly_rate: project.hourly_rate || undefined,
      budget: project.budget || undefined,
      status: project.status
    } : {
      status: 'active'
    }
  })

  const handleFormSubmit = async (data: ProjectFormData) => {
    try {
      const submitData: CreateProjectData = {
        ...data,
        client_id: data.client_id || undefined,
        hourly_rate: data.hourly_rate || undefined,
        budget: data.budget || undefined
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
          {project ? 'Edit Project' : 'Create New Project'}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Input
          label="Project Name"
          placeholder="Enter project name"
          error={errors.name?.message}
          {...register('name')}
        />

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe the project..."
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Hourly Rate (Optional)"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.hourly_rate?.message}
            {...register('hourly_rate', { valueAsNumber: true })}
          />

          <Input
            label="Budget (Optional)"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.budget?.message}
            {...register('budget', { valueAsNumber: true })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            {...register('status')}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            loading={isSubmitting}
            className="flex-1"
          >
            {project ? 'Update Project' : 'Create Project'}
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