import React, { useState } from 'react'
import { useTimer } from '../../contexts/TimerContext'
import { useProjects } from '../../hooks/useProjects'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Play, Pause, Square, Clock } from 'lucide-react'
import { formatDuration } from '../../utils/timeUtils'

export const TimerWidget: React.FC = () => {
  const { 
    isRunning, 
    elapsedTime, 
    selectedProject, 
    startTimer, 
    stopTimer, 
    setSelectedProject 
  } = useTimer()
  const { projects } = useProjects()
  const [description, setDescription] = useState('')

  const handleStart = async () => {
    if (!selectedProject) return
    try {
      await startTimer(selectedProject.id, description)
      setDescription('')
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  const handleStop = async () => {
    try {
      await stopTimer()
    } catch (error) {
      console.error('Failed to stop timer:', error)
    }
  }

  const activeProjects = projects.filter(p => p.status === 'active')

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <Clock className="w-6 h-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Time Tracker</h3>
        </div>
        
        <div className="text-4xl font-mono font-bold text-gray-900 mb-2">
          {formatDuration(elapsedTime)}
        </div>
        
        {isRunning && selectedProject && (
          <div className="text-sm text-gray-600">
            Tracking: <span className="font-medium">{selectedProject.name}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {!isRunning && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Project
              </label>
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = projects.find(p => p.id === e.target.value)
                  setSelectedProject(project || null)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a project...</option>
                {activeProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.client && `(${project.client.name})`}
                  </option>
                ))}
              </select>
            </div>

            <Input
              placeholder="What are you working on? (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </>
        )}

        <div className="flex gap-2">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              disabled={!selectedProject}
              icon={Play}
              className="flex-1"
              size="lg"
            >
              Start Timer
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              variant="danger"
              icon={Square}
              className="flex-1"
              size="lg"
            >
              Stop Timer
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}