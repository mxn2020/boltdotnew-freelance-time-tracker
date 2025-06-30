//src/components/projects/ProjectCard.tsx
import React from 'react'
import { Project } from '../../types/projects'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { FolderOpen, Users, DollarSign, Calendar, MoreHorizontal } from 'lucide-react'
import { formatCurrency } from '../../utils/timeUtils'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onViewDetails: (project: Project) => void
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onViewDetails
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <FolderOpen className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="font-semibold text-gray-900">{project.name}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
          <Button
            variant="ghost"
            size="sm"
            icon={MoreHorizontal}
            onClick={() => onEdit(project)}
          />
        </div>
      </div>

      {project.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="space-y-2 mb-4">
        {project.client && (
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span>{project.client.name}</span>
          </div>
        )}

        {project.hourly_rate && (
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2" />
            <span>{formatCurrency(project.hourly_rate)}/hour</span>
          </div>
        )}

        {project.budget && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Budget: {formatCurrency(project.budget)}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(project)}
          className="flex-1"
        >
          View Details
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(project)}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(project)}
          className="text-red-600 hover:text-red-700"
        >
          Delete
        </Button>
      </div>
    </Card>
  )
}