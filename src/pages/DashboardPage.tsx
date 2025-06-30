//src/pages/DashboardPage.tsx
import React from 'react'
import { useTimer } from '../contexts/TimerContext'
import { useProjects } from '../hooks/useProjects'
import { useTimeEntries } from '../hooks/useTimeEntries'
import { useAuth } from '../contexts/AuthContext'
import { TimerWidget } from '../components/timer/TimerWidget'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Clock, DollarSign, FolderOpen, Users } from 'lucide-react'
import { formatDurationShort, calculateEarnings, formatCurrency, getTodayTimeRange } from '../utils/timeUtils'
import { useMemo } from 'react'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { isRunning, selectedProject } = useTimer()
  const { projects } = useProjects()
  const { timeEntries } = useTimeEntries()

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const { start, end } = getTodayTimeRange()
    const todayEntries = timeEntries.filter(entry => 
      entry.start_time >= start && entry.start_time < end && entry.end_time
    )

    const totalSeconds = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const billableSeconds = todayEntries
      .filter(entry => entry.is_billable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)
    
    const totalEarnings = todayEntries
      .filter(entry => entry.is_billable)
      .reduce((sum, entry) => {
        const rate = entry.hourly_rate || entry.project?.hourly_rate || user?.hourly_rate || 0
        return sum + calculateEarnings(entry.duration || 0, rate)
      }, 0)

    return {
      totalTime: totalSeconds,
      billableTime: billableSeconds,
      earnings: totalEarnings,
      entriesCount: todayEntries.length
    }
  }, [timeEntries, user])

  const activeProjects = projects.filter(p => p.status === 'active')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your freelance business today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDurationShort(todayStats.totalTime)}
              </p>
              {isRunning && (
                <p className="text-xs text-green-600 font-medium">Timer running</p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Today's Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(todayStats.earnings)}
              </p>
              <p className="text-xs text-gray-500">
                {formatDurationShort(todayStats.billableTime)} billable
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderOpen className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Projects</p>
              <p className="text-2xl font-semibold text-gray-900">{activeProjects.length}</p>
              {selectedProject && (
                <p className="text-xs text-gray-500 truncate">
                  Current: {selectedProject.name}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Time Entries</p>
              <p className="text-2xl font-semibold text-gray-900">{todayStats.entriesCount}</p>
              <p className="text-xs text-gray-500">Today</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Timer and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <TimerWidget />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">Active Projects</h4>
              {activeProjects.length > 0 ? (
                <div className="space-y-1">
                  {activeProjects.slice(0, 3).map(project => (
                    <div key={project.id} className="text-sm text-blue-700">
                      {project.name}
                      {project.client && (
                        <span className="text-blue-600"> • {project.client.name}</span>
                      )}
                    </div>
                  ))}
                  {activeProjects.length > 3 && (
                    <div className="text-sm text-blue-600">
                      +{activeProjects.length - 3} more projects
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-blue-700">No active projects</p>
              )}
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-1">Today's Progress</h4>
              <div className="text-sm text-green-700">
                <div>Total: {formatDurationShort(todayStats.totalTime)}</div>
                <div>Billable: {formatDurationShort(todayStats.billableTime)}</div>
                <div>Earnings: {formatCurrency(todayStats.earnings)}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}