import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Project, CreateProjectData } from '../types/projects'
import toast from 'react-hot-toast'

export const useProjects = () => {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData: CreateProjectData): Promise<Project> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          user_id: user.id
        })
        .select(`
          *,
          client:clients(*)
        `)
        .single()

      if (error) throw error

      setProjects(prev => [data, ...prev])
      toast.success('Project created successfully!')
      return data
    } catch (err: any) {
      toast.error('Failed to create project')
      throw err
    }
  }

  const updateProject = async (id: string, updates: Partial<CreateProjectData>): Promise<void> => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await fetchProjects()
      toast.success('Project updated successfully!')
    } catch (err: any) {
      toast.error('Failed to update project')
      throw err
    }
  }

  const deleteProject = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success('Project deleted successfully!')
    } catch (err: any) {
      toast.error('Failed to delete project')
      throw err
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user])

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject
  }
}