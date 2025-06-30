// src/components/analytics/GoalTracker.tsx
import React, { useState } from 'react'
import { useGoals } from '../../hooks/useGoals'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Goal, CreateGoalData } from '../../types/analytics'
import { Plus, Target, Calendar, TrendingUp, CheckCircle, Pause, X } from 'lucide-react'
import { format } from 'date-fns'
import { GoalForm } from './GoalForm'

export const GoalTracker: React.FC = () => {
  const { goals, loading, createGoal, updateGoalStatus, deleteGoal } = useGoals()
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  const handleCreateGoal = async (data: CreateGoalData) => {
    await createGoal(data)
    setShowForm(false)
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setShowForm(true)
  }

  const handleDeleteGoal = async (goal: Goal) => {
    if (window.confirm(`Are you sure you want to delete the goal "${goal.title}"?`)) {
      await deleteGoal(goal.id)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingGoal(null)
  }

  const getGoalProgress = (goal: Goal): number => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100)
  }

  const getGoalStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getGoalTypeLabel = (type: Goal['type']) => {
    switch (type) {
      case 'hours':
        return 'Hours'
      case 'earnings':
        return 'Earnings ($)'
      case 'projects':
        return 'Projects'
      case 'clients':
        return 'Clients'
      case 'productivity':
        return 'Productivity (%)'
      default:
        return type
    }
  }

  const formatGoalValue = (value: number, type: Goal['type']) => {
    switch (type) {
      case 'hours':
        return `${value.toFixed(1)}h`
      case 'earnings':
        return `$${value.toFixed(0)}`
      case 'productivity':
        return `${value.toFixed(1)}%`
      default:
        return value.toString()
    }
  }

  const activeGoals = goals.filter(goal => goal.status === 'active')
  const completedGoals = goals.filter(goal => goal.status === 'completed')

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingGoal ? 'Edit Goal' : 'Create New Goal'}
          </h2>
        </div>

        <GoalForm
          goal={editingGoal || undefined}
          onSubmit={handleCreateGoal}
          onCancel={handleCancelForm}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Goal Tracker</h2>
          <p className="text-gray-600">Set and track your productivity goals</p>
        </div>
        <Button
          icon={Plus}
          onClick={() => setShowForm(true)}
        >
          New Goal
        </Button>
      </div>

      {/* Goal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Goals</p>
              <p className="text-2xl font-semibold text-gray-900">{activeGoals.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{completedGoals.length}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {goals.length > 0 ? Math.round((completedGoals.length / goals.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <Card className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
          <p className="text-gray-500 mb-4">Set your first goal to start tracking progress</p>
          <Button
            icon={Plus}
            onClick={() => setShowForm(true)}
          >
            Create Goal
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Active Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeGoals.map((goal) => {
                  const progress = getGoalProgress(goal)
                  const isOverdue = new Date(goal.target_date) < new Date() && goal.status === 'active'
                  
                  return (
                    <Card key={goal.id} className={`${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                          {goal.description && (
                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGoalStatusColor(goal.status)}`}>
                            {goal.status}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={X}
                            onClick={() => handleDeleteGoal(goal)}
                            className="text-red-600 hover:text-red-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{getGoalTypeLabel(goal.type)}</span>
                          <span className="font-medium">
                            {formatGoalValue(goal.current_value, goal.type)} / {formatGoalValue(goal.target_value, goal.type)}
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progress >= 100 ? 'bg-green-500' : progress >= 75 ? 'bg-blue-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-500">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>Due: {format(new Date(goal.target_date), 'MMM d, yyyy')}</span>
                          </div>
                          <span className={`font-medium ${progress >= 100 ? 'text-green-600' : 'text-gray-900'}`}>
                            {progress.toFixed(1)}%
                          </span>
                        </div>

                        {isOverdue && (
                          <div className="text-sm text-red-600 font-medium">
                            ⚠️ Overdue
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        {goal.status === 'active' && progress >= 100 && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={CheckCircle}
                            onClick={() => updateGoalStatus(goal.id, 'completed')}
                            className="text-green-600 hover:text-green-700"
                          >
                            Mark Complete
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Pause}
                          onClick={() => updateGoalStatus(goal.id, 'paused')}
                        >
                          Pause
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Completed Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedGoals.slice(0, 6).map((goal) => (
                  <Card key={goal.id} className="bg-green-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{goal.title}</h4>
                        <p className="text-sm text-gray-600">
                          {formatGoalValue(goal.target_value, goal.type)} {getGoalTypeLabel(goal.type).toLowerCase()}
                        </p>
                      </div>
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}