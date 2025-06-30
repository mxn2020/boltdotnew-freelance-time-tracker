import React from 'react'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Clock, DollarSign, BarChart3, TrendingUp } from 'lucide-react'
import { formatDuration, formatCurrency, calculateEarnings } from '../../utils/timeUtils'
import { TimeEntry } from '../../types/projects'

interface ReportSummaryProps {
  timeEntries: TimeEntry[]
  dateRange: string
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({
  timeEntries,
  dateRange
}) => {
  const totalSeconds = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
  
  const billableEntries = timeEntries.filter(entry => entry.is_billable)
  const billableSeconds = billableEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
  
  const totalEarnings = billableEntries.reduce((sum, entry) => {
    const rate = entry.hourly_rate || entry.project?.hourly_rate || 0
    return sum + calculateEarnings(entry.duration || 0, rate)
  }, 0)

  const averageHourlyRate = billableSeconds > 0 ? (totalEarnings / (billableSeconds / 3600)) : 0
  
  const uniqueProjects = new Set(timeEntries.map(entry => entry.project_id)).size
  const uniqueClients = new Set(
    timeEntries
      .filter(entry => entry.project?.client_id)
      .map(entry => entry.project!.client_id)
  ).size

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Time</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatDuration(totalSeconds)}
            </p>
            <p className="text-xs text-gray-500">{dateRange}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Earnings</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(totalEarnings)}
            </p>
            <p className="text-xs text-gray-500">
              {formatDuration(billableSeconds)} billable
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Avg. Hourly Rate</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(averageHourlyRate)}
            </p>
            <p className="text-xs text-gray-500">Weighted average</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Projects</p>
            <p className="text-2xl font-semibold text-gray-900">{uniqueProjects}</p>
            <p className="text-xs text-gray-500">
              {uniqueClients} client{uniqueClients !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}