// src/pages/AnalyticsPage.tsx
import React, { useState } from 'react'
import { useAnalytics } from '../hooks/useAnalytics'
import { ProductivityDashboard } from '../components/analytics/ProductivityDashboard'
import { GoalTracker } from '../components/analytics/GoalTracker'
import { InsightsPanel } from '../components/analytics/InsightsPanel'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { BarChart3, Target, Lightbulb, Calendar, Filter } from 'lucide-react'
import { AnalyticsFilters } from '../types/analytics'

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'insights'>('overview')
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: 'month',
    includeNonBillable: true
  })

  const { productivityMetrics, loading } = useAnalytics(filters)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'insights', label: 'Insights', icon: Lightbulb }
  ]

  const dateRangeOptions = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ]

  const handleDateRangeChange = (dateRange: AnalyticsFilters['dateRange']) => {
    setFilters(prev => ({ ...prev, dateRange }))
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
          <p className="text-gray-600">Track your productivity and achieve your goals</p>
        </div>
        
        {activeTab === 'overview' && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={filters.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value as AnalyticsFilters['dateRange'])}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeNonBillable"
                checked={filters.includeNonBillable}
                onChange={(e) => setFilters(prev => ({ ...prev, includeNonBillable: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="includeNonBillable" className="ml-2 text-sm text-gray-700">
                Include non-billable time
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <ProductivityDashboard metrics={productivityMetrics} />
        )}
        
        {activeTab === 'goals' && (
          <GoalTracker />
        )}
        
        {activeTab === 'insights' && (
          <InsightsPanel />
        )}
      </div>
    </div>
  )
}