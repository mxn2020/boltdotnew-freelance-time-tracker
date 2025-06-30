import React from 'react'
import { TimeEntry } from '../../types/projects'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Clock, Edit, Trash2, DollarSign } from 'lucide-react'
import { formatDuration, formatCurrency, calculateEarnings } from '../../utils/timeUtils'
import { format } from 'date-fns'

interface TimeEntryListProps {
  timeEntries: TimeEntry[]
  onEdit: (entry: TimeEntry) => void
  onDelete: (entry: TimeEntry) => void
}

export const TimeEntryList: React.FC<TimeEntryListProps> = ({
  timeEntries,
  onEdit,
  onDelete
}) => {
  if (timeEntries.length === 0) {
    return (
      <Card className="text-center py-8">
        <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No time entries yet</h3>
        <p className="text-gray-500">Start tracking time to see your entries here</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {timeEntries.map((entry) => {
        const duration = entry.duration || 0
        const hourlyRate = entry.hourly_rate || entry.project?.hourly_rate || 0
        const earnings = calculateEarnings(duration, hourlyRate)

        return (
          <Card key={entry.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Clock className="w-4 h-4 text-blue-600 mr-2" />
                  <h4 className="font-medium text-gray-900">
                    {entry.project?.name}
                  </h4>
                  {entry.project?.client && (
                    <span className="ml-2 text-sm text-gray-500">
                      • {entry.project.client.name}
                    </span>
                  )}
                </div>

                {entry.description && (
                  <p className="text-gray-600 text-sm mb-2">{entry.description}</p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    {format(new Date(entry.start_time), 'MMM d, yyyy h:mm a')}
                    {entry.end_time && (
                      <> - {format(new Date(entry.end_time), 'h:mm a')}</>
                    )}
                  </span>
                  
                  <span className="font-medium text-gray-900">
                    {formatDuration(duration)}
                  </span>

                  {entry.is_billable && hourlyRate > 0 && (
                    <div className="flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      <span>{formatCurrency(earnings)}</span>
                    </div>
                  )}

                  {!entry.is_billable && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      Non-billable
                    </span>
                  )}

                  {!entry.end_time && (
                    <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                      Active
                    </span>
                  )}
                </div>

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit}
                  onClick={() => onEdit(entry)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => onDelete(entry)}
                  className="text-red-600 hover:text-red-700"
                />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}