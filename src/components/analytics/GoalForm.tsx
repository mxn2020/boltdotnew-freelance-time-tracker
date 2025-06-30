// src/components/analytics/GoalForm.tsx
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreateGoalData, Goal } from '../../types/analytics'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader, CardTitle } from '../ui/Card'

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['hours', 'earnings', 'projects', 'clients', 'productivity']),
  target_value: z.number().min(0.01, 'Target value must be greater than 0'),
  target_date: z.string().min(1, 'Target date is required')
})

type GoalFormData = z.infer<typeof goalSchema>

interface GoalFormProps {
  goal?: Goal
  onSubmit: (data: CreateGoalData) => Promise<void>
  onCancel: () => void
}

export const GoalForm: React.FC<GoalFormProps> = ({
  goal,
  onSubmit,
  onCancel
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: goal ? {
      title: goal.title,
      description: goal.description || '',
      type: goal.type,
      target_value: goal.target_value,
      target_date: goal.target_date
    } : {
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    }
  })

  const selectedType = watch('type')

  const handleFormSubmit = async (data: GoalFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'hours':
        return 'Track total hours worked'
      case 'earnings':
        return 'Track total earnings in dollars'
      case 'projects':
        return 'Track number of projects worked on'
      case 'clients':
        return 'Track number of unique clients'
      case 'productivity':
        return 'Track productivity rate (billable vs total hours)'
      default:
        return ''
    }
  }

  const getPlaceholder = (type: string) => {
    switch (type) {
      case 'hours':
        return '40'
      case 'earnings':
        return '5000'
      case 'projects':
        return '5'
      case 'clients':
        return '3'
      case 'productivity':
        return '80'
      default:
        return '0'
    }
  }

  const getUnit = (type: string) => {
    switch (type) {
      case 'hours':
        return 'hours'
      case 'earnings':
        return 'dollars'
      case 'projects':
        return 'projects'
      case 'clients':
        return 'clients'
      case 'productivity':
        return 'percent'
      default:
        return ''
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {goal ? 'Edit Goal' : 'Create New Goal'}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <Input
          label="Goal Title"
          placeholder="e.g., Work 40 hours this month"
          error={errors.title?.message}
          {...register('title')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your goal and why it's important..."
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Goal Type
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            {...register('type')}
          >
            <option value="">Select goal type</option>
            <option value="hours">Hours Worked</option>
            <option value="earnings">Earnings</option>
            <option value="projects">Projects</option>
            <option value="clients">Clients</option>
            <option value="productivity">Productivity Rate</option>
          </select>
          {selectedType && (
            <p className="text-sm text-gray-500 mt-1">{getTypeDescription(selectedType)}</p>
          )}
          {errors.type && (
            <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Target Value"
              type="number"
              step={selectedType === 'earnings' ? '0.01' : selectedType === 'hours' ? '0.1' : '1'}
              placeholder={getPlaceholder(selectedType || '')}
              error={errors.target_value?.message}
              {...register('target_value', { valueAsNumber: true })}
            />
            {selectedType && (
              <p className="text-sm text-gray-500 mt-1">Target in {getUnit(selectedType)}</p>
            )}
          </div>

          <Input
            label="Target Date"
            type="date"
            error={errors.target_date?.message}
            {...register('target_date')}
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            loading={isSubmitting}
            className="flex-1"
          >
            {goal ? 'Update Goal' : 'Create Goal'}
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