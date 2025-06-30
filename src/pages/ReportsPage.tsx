import React, { useState, useMemo } from 'react'
import { useTimeEntries } from '../hooks/useTimeEntries'
import { useProjects } from '../hooks/useProjects'
import { useClients } from '../hooks/useClients'
import { TimeEntriesFilter } from '../components/reports/TimeEntriesFilter'
import { ReportSummary } from '../components/reports/ReportSummary'
import { TimeDistributionChart } from '../components/reports/TimeDistributionChart'
import { ExportOptions } from '../components/reports/ExportOptions'
import { TimeEntryList } from '../components/time/TimeEntryList'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Calendar, BarChart3, FileText } from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

interface FilterOptions {
  search: string
  startDate: string
  endDate: string
  projectId: string
  clientId: string
  billableOnly: boolean
}

export const ReportsPage: React.FC = () => {
  const { timeEntries, loading } = useTimeEntries()
  const { projects } = useProjects()
  const { clients } = useClients()
  
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    startDate: '',
    endDate: '',
    projectId: '',
    clientId: '',
    billableOnly: false
  })

  const [chartGroupBy, setChartGroupBy] = useState<'project' | 'client'>('project')

  // Quick date range buttons
  const setDateRange = (range: 'today' | 'week' | 'month' | 'last30') => {
    const today = new Date()
    let startDate: Date
    let endDate: Date = today

    switch (range) {
      case 'today':
        startDate = today
        break
      case 'week':
        startDate = startOfWeek(today)
        endDate = endOfWeek(today)
        break
      case 'month':
        startDate = startOfMonth(today)
        endDate = endOfMonth(today)
        break
      case 'last30':
        startDate = subDays(today, 30)
        break
      default:
        return
    }

    setFilters(prev => ({
      ...prev,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      startDate: '',
      endDate: '',
      projectId: '',
      clientId: '',
      billableOnly: false
    })
  }

  // Filter time entries based on current filters
  const filteredTimeEntries = useMemo(() => {
    return timeEntries.filter(entry => {
      // Search filter
      if (filters.search && !entry.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }

      // Date range filter
      if (filters.startDate) {
        const entryDate = format(new Date(entry.start_time), 'yyyy-MM-dd')
        if (entryDate < filters.startDate) return false
      }
      if (filters.endDate) {
        const entryDate = format(new Date(entry.start_time), 'yyyy-MM-dd')
        if (entryDate > filters.endDate) return false
      }

      // Project filter
      if (filters.projectId && entry.project_id !== filters.projectId) {
        return false
      }

      // Client filter
      if (filters.clientId && entry.project?.client_id !== filters.clientId) {
        return false
      }

      // Billable filter
      if (filters.billableOnly && !entry.is_billable) {
        return false
      }

      return true
    })
  }, [timeEntries, filters])

  const getDateRangeLabel = () => {
    if (filters.startDate && filters.endDate) {
      return `${format(new Date(filters.startDate), 'MMM d, yyyy')} - ${format(new Date(filters.endDate), 'MMM d, yyyy')}`
    } else if (filters.startDate) {
      return `From ${format(new Date(filters.startDate), 'MMM d, yyyy')}`
    } else if (filters.endDate) {
      return `Until ${format(new Date(filters.endDate), 'MMM d, yyyy')}`
    }
    return 'All Time'
  }

  const handleEditEntry = (entry: any) => {
    // TODO: Implement edit functionality
    console.log('Edit entry:', entry)
  }

  const handleDeleteEntry = (entry: any) => {
    // TODO: Implement delete functionality
    console.log('Delete entry:', entry)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading reports...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Analyze your time tracking data and generate reports</p>
        </div>
      </div>

      {/* Quick Date Range Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Quick Date Ranges
          </CardTitle>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRange('today')}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRange('week')}
          >
            This Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRange('month')}
          >
            This Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateRange('last30')}
          >
            Last 30 Days
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <TimeEntriesFilter
        filters={filters}
        onFiltersChange={setFilters}
        projects={projects.map(p => ({ id: p.id, name: p.name }))}
        clients={clients.map(c => ({ id: c.id, name: c.name }))}
        onClearFilters={clearFilters}
      />

      {/* Summary */}
      <ReportSummary
        timeEntries={filteredTimeEntries}
        dateRange={getDateRangeLabel()}
      />

      {/* Charts and Export */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Time Distribution
            </h3>
            <div className="flex space-x-2">
              <Button
                variant={chartGroupBy === 'project' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setChartGroupBy('project')}
              >
                By Project
              </Button>
              <Button
                variant={chartGroupBy === 'client' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setChartGroupBy('client')}
              >
                By Client
              </Button>
            </div>
          </div>
          <TimeDistributionChart
            timeEntries={filteredTimeEntries}
            groupBy={chartGroupBy}
          />
        </div>

        <ExportOptions
          timeEntries={filteredTimeEntries}
          dateRange={getDateRangeLabel()}
          filters={filters}
        />
      </div>

      {/* Detailed Time Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Detailed Time Entries ({filteredTimeEntries.length})
          </CardTitle>
        </CardHeader>
        
        {filteredTimeEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No time entries found for the selected filters
          </div>
        ) : (
          <TimeEntryList
            timeEntries={filteredTimeEntries.slice(0, 50)} // Limit to 50 for performance
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
          />
        )}
        
        {filteredTimeEntries.length > 50 && (
          <div className="text-center py-4 text-gray-500 border-t">
            Showing first 50 entries. Use filters to narrow down results or export for full data.
          </div>
        )}
      </Card>
    </div>
  )
}