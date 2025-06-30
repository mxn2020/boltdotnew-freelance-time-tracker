import React from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Search, Calendar, Filter, X } from 'lucide-react'
import { format } from 'date-fns'

interface FilterOptions {
  search: string
  startDate: string
  endDate: string
  projectId: string
  clientId: string
  billableOnly: boolean
}

interface TimeEntriesFilterProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  projects: Array<{ id: string; name: string }>
  clients: Array<{ id: string; name: string }>
  onClearFilters: () => void
}

export const TimeEntriesFilter: React.FC<TimeEntriesFilterProps> = ({
  filters,
  onFiltersChange,
  projects,
  clients,
  onClearFilters
}) => {
  const updateFilter = (key: keyof FilterOptions, value: string | boolean) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const hasActiveFilters = filters.search || filters.startDate || filters.endDate || 
    filters.projectId || filters.clientId || filters.billableOnly

  return (
    <Card className="mb-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter Time Entries
          </h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              icon={X}
              onClick={onClearFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            placeholder="Search descriptions..."
            icon={Search}
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.projectId}
              onChange={(e) => updateFilter('projectId', e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.clientId}
              onChange={(e) => updateFilter('clientId', e.target.value)}
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="billableOnly"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={filters.billableOnly}
              onChange={(e) => updateFilter('billableOnly', e.target.checked)}
            />
            <label htmlFor="billableOnly" className="text-sm font-medium text-gray-700">
              Billable only
            </label>
          </div>
        </div>
      </div>
    </Card>
  )
}