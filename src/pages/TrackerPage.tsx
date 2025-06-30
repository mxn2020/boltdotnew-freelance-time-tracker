// src/pages/TrackerPage.tsx

import React from 'react'
import { TimerWidget } from '../components/timer/TimerWidget'
import { TimeEntryList } from '../components/time/TimeEntryList'
import { useTimeEntries } from '../hooks/useTimeEntries'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Plus } from 'lucide-react'

export const TrackerPage: React.FC = () => {
  const { timeEntries, loading } = useTimeEntries()

  const handleEditEntry = (entry: any) => {
    // TODO: Implement edit functionality
    console.log('Edit entry:', entry)
  }

  const handleDeleteEntry = (entry: any) => {
    // TODO: Implement delete functionality
    console.log('Delete entry:', entry)
  }

  const recentEntries = timeEntries.slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Time Tracker</h1>
        <p className="text-gray-600">Track your time and manage your work sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <TimerWidget />
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Time Entries</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  onClick={() => {/* TODO: Add manual entry */}}
                >
                  Add Manual Entry
                </Button>
              </div>
            </CardHeader>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading time entries...</p>
              </div>
            ) : (
              <TimeEntryList
                timeEntries={recentEntries}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}