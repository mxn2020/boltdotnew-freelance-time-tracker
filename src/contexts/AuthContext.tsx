// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { User, AuthState, LoginCredentials, RegisterCredentials } from '../types/auth'
import toast from 'react-hot-toast'

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  })
  
  // Track if we're in the middle of a logout to prevent race conditions
  const isLoggingOut = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted.current) return
        
        if (error) {
          console.error('Error getting session:', error)
          setState({ user: null, loading: false, error: 'Failed to load session' })
          return
        }

        if (session?.user) {
          await fetchUserProfile(session.user)
        } else {
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted.current) {
          setState({ user: null, loading: false, error: 'Failed to initialize authentication' })
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted.current) return

        console.log('Auth state change:', event, session?.user?.id)

        // Handle explicit logout
        if (event === 'SIGNED_OUT') {
          if (!isLoggingOut.current) {
            // This was an external logout (e.g., from another tab)
            setState({ user: null, loading: false, error: null })
          }
          return
        }

        // Don't process auth changes if we're in the middle of logging out
        if (isLoggingOut.current) {
          return
        }

        if (session?.user) {
          await fetchUserProfile(session.user)
        } else {
          setState({ user: null, loading: false, error: null })
        }
      }
    )

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error) throw error

      if (mounted.current) {
        setState({
          user: data,
          loading: false,
          error: null
        })
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      if (mounted.current) {
        setState({
          user: null,
          loading: false,
          error: 'Failed to load user profile'
        })
      }
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) throw error
      
      toast.success('Successfully logged in!')
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      toast.error(errorMessage)
      throw error
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password
      })

      if (error) throw error

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: credentials.email,
            full_name: credentials.full_name,
            business_name: credentials.business_name,
            timezone: credentials.timezone,
            hourly_rate: credentials.hourly_rate
          })

        if (profileError) throw profileError
      }

      toast.success('Account created successfully!')
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      toast.error(errorMessage)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Set the logout flag to prevent race conditions
      isLoggingOut.current = true
      
      // Clear state immediately
      setState({ user: null, loading: false, error: null })
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase logout error:', error)
        // Even if Supabase logout fails, we've cleared local state
      }
      
      toast.success('Successfully logged out!')
    } catch (error: any) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
      throw error
    } finally {
      // Reset the logout flag after a short delay to allow auth state to settle
      setTimeout(() => {
        isLoggingOut.current = false
      }, 100)
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!state.user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', state.user.id)

      if (error) throw error

      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null
      }))

      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error('Failed to update profile')
      throw error
    }
  }

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}