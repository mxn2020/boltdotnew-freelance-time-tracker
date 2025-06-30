// src/components/analytics/ProductivityDashboard.tsx
import React from 'react'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { ProductivityMetrics } from '../../types/analytics'
import { TrendingUp, Clock, Target, Zap, Calendar, BarChart3 } from 'lucide-react'
import { formatDuration } from '../../utils/timeUtils'

interface ProductivityDashboardProps {
  metrics: ProductivityMetrics
}

export const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({
  metrics
}) => {
  const getProductivityColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProductivityBgColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100'
    if (rate >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatDuration(metrics.totalHours * 3600).split(':').slice(0, 2).join(':')}
              </p>
              <p className="text-xs text-gray-500">
                {formatDuration(metrics.billableHours * 3600).split(':').slice(0, 2).join(':')} billable
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className={`h-8 w-8 ${getProductivityColor(metrics.productivityRate)}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Productivity Rate</p>
              <p className={`text-2xl font-semibold ${getProductivityColor(metrics.productivityRate)}`}>
                {metrics.productivityRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">Billable vs Total</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Session</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.averageSessionLength.toFixed(1)}h
              </p>
              <p className="text-xs text-gray-500">Per work session</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Peak Hours</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics.peakProductivityHours.length > 0 
                  ? formatHour(metrics.peakProductivityHours[0])
                  : 'N/A'
                }
              </p>
              <p className="text-xs text-gray-500">Most productive</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Productivity Pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Daily Productivity Pattern
          </CardTitle>
        </CardHeader>
        
        <div className="space-y-4">
          {metrics.dailyAverages.map((day) => (
            <div key={day.dayOfWeek} className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-20 text-sm font-medium text-gray-900">
                  {day.dayName}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((day.averageHours / 8) * 100, 100)}%` }}
                  />
                </div>
                <div className="w-16 text-sm text-gray-600 text-right">
                  {day.averageHours.toFixed(1)}h
                </div>
              </div>
              <div className="ml-4 flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getProductivityBgColor(day.productivityScore)} ${getProductivityColor(day.productivityScore)}`}>
                  {day.productivityScore.toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Weekly Trends (Last 8 Weeks)
          </CardTitle>
        </CardHeader>
        
        <div className="space-y-3">
          {metrics.weeklyTrends.map((week, index) => {
            const isCurrentWeek = index === metrics.weeklyTrends.length - 1
            return (
              <div key={week.weekStart} className={`p-3 rounded-lg ${isCurrentWeek ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-900">
                    Week of {new Date(week.weekStart).toLocaleDateString()}
                    {isCurrentWeek && <span className="ml-2 text-blue-600">(Current)</span>}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getProductivityBgColor(week.productivityScore)} ${getProductivityColor(week.productivityScore)}`}>
                    {week.productivityScore.toFixed(0)}% productive
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Hours:</span>
                    <span className="ml-1 font-medium">{week.totalHours.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sessions:</span>
                    <span className="ml-1 font-medium">{week.sessionsCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Earnings:</span>
                    <span className="ml-1 font-medium">${week.earnings.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Monthly Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Monthly Growth (Last 6 Months)
          </CardTitle>
        </CardHeader>
        
        <div className="space-y-3">
          {metrics.monthlyComparison.map((month, index) => {
            const isCurrentMonth = index === metrics.monthlyComparison.length - 1
            const growthColor = month.growthRate > 0 ? 'text-green-600' : month.growthRate < 0 ? 'text-red-600' : 'text-gray-600'
            
            return (
              <div key={`${month.month}-${month.year}`} className={`p-4 rounded-lg ${isCurrentMonth ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold text-gray-900">
                    {month.month} {month.year}
                    {isCurrentMonth && <span className="ml-2 text-green-600">(Current)</span>}
                  </div>
                  {month.growthRate !== 0 && (
                    <div className={`flex items-center ${growthColor}`}>
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">
                        {month.growthRate > 0 ? '+' : ''}{month.growthRate.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Total Hours</div>
                    <div className="font-semibold">{month.totalHours.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Earnings</div>
                    <div className="font-semibold">${month.earnings.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Projects</div>
                    <div className="font-semibold">{month.projectsWorked}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Avg Rate</div>
                    <div className="font-semibold">${month.averageHourlyRate.toFixed(0)}/h</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}