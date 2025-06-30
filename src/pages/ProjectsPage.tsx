import React, { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import { ProjectCard } from '../components/projects/ProjectCard'
import { ProjectForm } from '../components/projects/ProjectForm'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Plus, FolderOpen } from 'lucide-react'
import { Project, CreateProjectData } from '../types/projects'

export const ProjectsPage: React.FC = () => {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects()
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const handleCreateProject = async (data: CreateProjectData) => {
    await createProject(data)
    setShowForm(false)
  }

  const handleUpdateProject = async (data: CreateProjectData) => {
    if (editingProject) {
      await updateProject(editingProject.id, data)
      setEditingProject(null)
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowForm(true)
  }

  const handleDeleteProject = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      await deleteProject(project.id)
    }
  }

  const handleViewDetails = (project: Project) => {
    // TODO: Navigate to project details page
    console.log('View project details:', project)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingProject(null)
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </h1>
        </div>

        <ProjectForm
          project={editingProject || undefined}
          onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
          onCancel={handleCancelForm}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage your projects and track progress</p>
        </div>
        <Button
          icon={Plus}
          onClick={() => setShowForm(true)}
        >
          New Project
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card className="text-center py-12">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">Create your first project to get started</p>
          <Button
            icon={Plus}
            onClick={() => setShowForm(true)}
          >
            Create Project
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  )
}