//src/components/reports/TimeDistributionChart.tsx
import React from 'react'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { TimeEntry } from '../../types/projects'
import { formatDuration } from '../../utils/timeUtils'

interface TimeDistributionChartProps {
  timeEntries: TimeEntry[]
  groupBy: 'project' | 'client'
}

export const TimeDistributionChart: React.FC<TimeDistributionChartProps> = ({
  timeEntries,
  groupBy
}) => {
  const groupedData = React.useMemo(() => {
    const groups: Record<string, { name: string; seconds: number; color: string }> = {}
    
    timeEntries.forEach(entry => {
      const key = groupBy === 'project' 
        ? entry.project?.name || 'Unknown Project'
        : entry.project?.client?.name || 'No Client'
      
      if (!groups[key]) {
        groups[key] = {
          name: key,
          seconds: 0,
          color: getColorForIndex(Object.keys(groups).length)
        }
      }
      
      groups[key].seconds += entry.duration || 0
    })
    
    return Object.values(groups)
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 8) // Show top 8 items
  }, [timeEntries, groupBy])

  const totalSeconds = groupedData.reduce((sum, item) => sum + item.seconds, 0)

  if (groupedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Time Distribution by {groupBy === 'project' ? 'Project' : 'Client'}</CardTitle>
        </CardHeader>
        <div className="text-center py-8 text-gray-500">
          No data available for the selected period
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Distribution by {groupBy === 'project' ? 'Project' : 'Client'}</CardTitle>
      </CardHeader>
      
      <div className="space-y-4">
        {groupedData.map((item, index) => {
          const percentage = totalSeconds > 0 ? (item.seconds / totalSeconds) * 100 : 0
          
          return (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDuration(item.seconds)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function getColorForIndex(index: number): string {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ]
  return colors[index % colors.length]
}