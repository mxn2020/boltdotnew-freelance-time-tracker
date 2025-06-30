// src/hooks/useAnalytics.ts

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTimeEntries } from './useTimeEntries'
import { useProjects } from './useProjects'
import { useClients } from './useClients'
import { 
  ProductivityMetrics, 
  ProjectAnalytics, 
  ClientAnalytics, 
  AnalyticsFilters,
  DailyAverage,
  WeeklyTrend,
  MonthlyComparison,
  TimePattern
} from '../types/analytics'
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear,
  format,
  subDays,
  subWeeks,
  subMonths,
  getDay,
  parseISO
} from 'date-fns'

export const useAnalytics = (filters: AnalyticsFilters = { dateRange: 'month' }) => {
  const { user } = useAuth()
  const { timeEntries } = useTimeEntries()
  const { projects } = useProjects()
  const { clients } = useClients()
  const [loading, setLoading] = useState(false)

  // Calculate date range based on filters
  const dateRange = useMemo(() => {
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (filters.dateRange) {
      case 'week':
        start = startOfWeek(now)
        end = endOfWeek(now)
        break
      case 'month':
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case 'quarter':
        start = startOfQuarter(now)
        end = endOfQuarter(now)
        break
      case 'year':
        start = startOfYear(now)
        end = endOfYear(now)
        break
      case 'custom':
        start = filters.startDate ? parseISO(filters.startDate) : startOfMonth(now)
        end = filters.endDate ? parseISO(filters.endDate) : now
        break
      default:
        start = startOfMonth(now)
        end = endOfMonth(now)
    }

    return { start, end }
  }, [filters])

  // Filter time entries based on date range and filters
  const filteredTimeEntries = useMemo(() => {
    return timeEntries.filter(entry => {
      const entryDate = parseISO(entry.start_time)
      
      // Date range filter
      if (entryDate < dateRange.start || entryDate > dateRange.end) {
        return false
      }

      // Project filter
      if (filters.projectIds && filters.projectIds.length > 0) {
        if (!filters.projectIds.includes(entry.project_id)) {
          return false
        }
      }

      // Client filter
      if (filters.clientIds && filters.clientIds.length > 0) {
        if (!entry.project?.client_id || !filters.clientIds.includes(entry.project.client_id)) {
          return false
        }
      }

      // Billable filter
      if (filters.includeNonBillable === false && !entry.is_billable) {
        return false
      }

      return true
    })
  }, [timeEntries, dateRange, filters])

  // Calculate productivity metrics
  const productivityMetrics = useMemo((): ProductivityMetrics => {
    const totalSeconds = filteredTimeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const billableSeconds = filteredTimeEntries
      .filter(entry => entry.is_billable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)

    const totalHours = totalSeconds / 3600
    const billableHours = billableSeconds / 3600
    const productivityRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0

    // Calculate average session length
    const averageSessionLength = filteredTimeEntries.length > 0 
      ? totalSeconds / filteredTimeEntries.length / 3600 
      : 0

    // Calculate peak productivity hours
    const hourlyData = filteredTimeEntries.reduce((hours, entry) => {
      const hour = parseISO(entry.start_time).getHours()
      if (!hours[hour]) hours[hour] = 0
      hours[hour] += entry.duration || 0
      return hours
    }, {} as Record<number, number>)

    const peakProductivityHours = Object.entries(hourlyData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))

    // Calculate daily averages
    const dailyData = filteredTimeEntries.reduce((days, entry) => {
      const dayOfWeek = getDay(parseISO(entry.start_time))
      if (!days[dayOfWeek]) {
        days[dayOfWeek] = { totalSeconds: 0, sessions: 0, billableSeconds: 0 }
      }
      days[dayOfWeek].totalSeconds += entry.duration || 0
      days[dayOfWeek].sessions += 1
      if (entry.is_billable) {
        days[dayOfWeek].billableSeconds += entry.duration || 0
      }
      return days
    }, {} as Record<number, { totalSeconds: number; sessions: number; billableSeconds: number }>)

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dailyAverages: DailyAverage[] = Array.from({ length: 7 }, (_, i) => {
      const data = dailyData[i] || { totalSeconds: 0, sessions: 0, billableSeconds: 0 }
      const averageHours = data.totalSeconds / 3600
      const productivityScore = data.totalSeconds > 0 ? (data.billableSeconds / data.totalSeconds) * 100 : 0
      
      return {
        dayOfWeek: i,
        dayName: dayNames[i],
        averageHours,
        averageSessions: data.sessions,
        productivityScore
      }
    })

    // Calculate weekly trends (last 8 weeks)
    const weeklyTrends: WeeklyTrend[] = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i))
      const weekEnd = endOfWeek(weekStart)
      
      const weekEntries = timeEntries.filter(entry => {
        const entryDate = parseISO(entry.start_time)
        return entryDate >= weekStart && entryDate <= weekEnd
      })

      const weekTotalSeconds = weekEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
      const weekBillableSeconds = weekEntries
        .filter(entry => entry.is_billable)
        .reduce((sum, entry) => sum + (entry.duration || 0), 0)

      const weekEarnings = weekEntries
        .filter(entry => entry.is_billable)
        .reduce((sum, entry) => {
          const rate = entry.hourly_rate || entry.project?.hourly_rate || user?.hourly_rate || 0
          return sum + ((entry.duration || 0) / 3600) * rate
        }, 0)

      weeklyTrends.push({
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        totalHours: weekTotalSeconds / 3600,
        billableHours: weekBillableSeconds / 3600,
        earnings: weekEarnings,
        sessionsCount: weekEntries.length,
        productivityScore: weekTotalSeconds > 0 ? (weekBillableSeconds / weekTotalSeconds) * 100 : 0
      })
    }

    // Calculate monthly comparison (last 6 months)
    const monthlyComparison: MonthlyComparison[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i))
      const monthEnd = endOfMonth(monthStart)
      
      const monthEntries = timeEntries.filter(entry => {
        const entryDate = parseISO(entry.start_time)
        return entryDate >= monthStart && entryDate <= monthEnd
      })

      const monthTotalSeconds = monthEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
      const monthBillableSeconds = monthEntries
        .filter(entry => entry.is_billable)
        .reduce((sum, entry) => sum + (entry.duration || 0), 0)

      const monthEarnings = monthEntries
        .filter(entry => entry.is_billable)
        .reduce((sum, entry) => {
          const rate = entry.hourly_rate || entry.project?.hourly_rate || user?.hourly_rate || 0
          return sum + ((entry.duration || 0) / 3600) * rate
        }, 0)

      const uniqueProjects = new Set(monthEntries.map(entry => entry.project_id)).size
      const averageHourlyRate = monthBillableSeconds > 0 ? monthEarnings / (monthBillableSeconds / 3600) : 0

      // Calculate growth rate compared to previous month
      const prevMonthData = monthlyComparison[monthlyComparison.length - 1]
      const growthRate = prevMonthData && prevMonthData.earnings > 0 
        ? ((monthEarnings - prevMonthData.earnings) / prevMonthData.earnings) * 100 
        : 0

      monthlyComparison.push({
        month: format(monthStart, 'MMM'),
        year: monthStart.getFullYear(),
        totalHours: monthTotalSeconds / 3600,
        billableHours: monthBillableSeconds / 3600,
        earnings: monthEarnings,
        projectsWorked: uniqueProjects,
        averageHourlyRate,
        growthRate
      })
    }

    return {
      totalHours,
      billableHours,
      productivityRate,
      averageSessionLength,
      peakProductivityHours,
      dailyAverages,
      weeklyTrends,
      monthlyComparison
    }
  }, [filteredTimeEntries, timeEntries, user])

  // Calculate project analytics
  const projectAnalytics = useMemo((): ProjectAnalytics[] => {
    const projectGroups = filteredTimeEntries.reduce((groups, entry) => {
      const projectId = entry.project_id
      if (!groups[projectId]) {
        groups[projectId] = []
      }
      groups[projectId].push(entry)
      return groups
    }, {} as Record<string, typeof filteredTimeEntries>)

    return Object.entries(projectGroups).map(([projectId, entries]) => {
      const project = projects.find(p => p.id === projectId)
      const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
      const billableSeconds = entries
        .filter(entry => entry.is_billable)
        .reduce((sum, entry) => sum + (entry.duration || 0), 0)

      const earnings = entries
        .filter(entry => entry.is_billable)
        .reduce((sum, entry) => {
          const rate = entry.hourly_rate || entry.project?.hourly_rate || user?.hourly_rate || 0
          return sum + ((entry.duration || 0) / 3600) * rate
        }, 0)

      const averageHourlyRate = billableSeconds > 0 ? earnings / (billableSeconds / 3600) : 0
      const profitability = totalSeconds > 0 ? (billableSeconds / totalSeconds) * 100 : 0

      // Calculate time distribution
      const timeDistribution = entries.reduce((dist, entry) => {
        const date = format(parseISO(entry.start_time), 'yyyy-MM-dd')
        if (!dist[date]) {
          dist[date] = { hours: 0, sessions: 0, productivity: 0 }
        }
        dist[date].hours += (entry.duration || 0) / 3600
        dist[date].sessions += 1
        return dist
      }, {} as Record<string, { hours: number; sessions: number; productivity: number }>)

      const timeDistributionArray = Object.entries(timeDistribution).map(([date, data]) => ({
        date,
        hours: data.hours,
        sessions: data.sessions,
        productivity: data.hours > 0 ? (data.hours / data.sessions) : 0
      }))

      // Calculate completion rate (if project has budget)
      const budgetUtilization = project?.budget ? (earnings / project.budget) * 100 : undefined
      const completionRate = project?.status === 'completed' ? 100 : 
        (project?.budget ? Math.min(budgetUtilization || 0, 100) : 0)

      return {
        projectId,
        projectName: project?.name || 'Unknown Project',
        clientName: project?.client?.name,
        totalHours: totalSeconds / 3600,
        billableHours: billableSeconds / 3600,
        earnings,
        profitability,
        averageHourlyRate,
        timeDistribution: timeDistributionArray,
        completionRate,
        budgetUtilization
      }
    }).sort((a, b) => b.earnings - a.earnings)
  }, [filteredTimeEntries, projects, user])

  // Calculate client analytics
  const clientAnalytics = useMemo((): ClientAnalytics[] => {
    const clientGroups = filteredTimeEntries.reduce((groups, entry) => {
      const clientId = entry.project?.client_id
      if (!clientId) return groups
      
      if (!groups[clientId]) {
        groups[clientId] = []
      }
      groups[clientId].push(entry)
      return groups
    }, {} as Record<string, typeof filteredTimeEntries>)

    return Object.entries(clientGroups).map(([clientId, entries]) => {
      const client = clients.find(c => c.id === clientId)
      const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
      const billableSeconds = entries
        .filter(entry => entry.is_billable)
        .reduce((sum, entry) => sum + (entry.duration || 0), 0)

      const earnings = entries
        .filter(entry => entry.is_billable)
        .reduce((sum, entry) => {
          const rate = entry.hourly_rate || entry.project?.hourly_rate || user?.hourly_rate || 0
          return sum + ((entry.duration || 0) / 3600) * rate
        }, 0)

      const uniqueProjects = new Set(entries.map(entry => entry.project_id))
      const projectsCount = uniqueProjects.size
      const averageProjectValue = projectsCount > 0 ? earnings / projectsCount : 0

      // Calculate average response time (simplified - could be enhanced with actual communication data)
      const responseTime = 24 // Default 24 hours - this would be calculated from actual data

      // Get project analytics for this client
      const clientProjectAnalytics = projectAnalytics.filter(pa => 
        entries.some(entry => entry.project_id === pa.projectId)
      )

      return {
        clientId,
        clientName: client?.name || 'Unknown Client',
        totalHours: totalSeconds / 3600,
        billableHours: billableSeconds / 3600,
        earnings,
        projectsCount,
        averageProjectValue,
        responseTime,
        projects: clientProjectAnalytics
      }
    }).sort((a, b) => b.earnings - a.earnings)
  }, [filteredTimeEntries, clients, projectAnalytics, user])

  // Calculate time patterns
  const timePatterns = useMemo((): TimePattern[] => {
    const hourlyPatterns = filteredTimeEntries.reduce((patterns, entry) => {
      const hour = parseISO(entry.start_time).getHours()
      const dayOfWeek = getDay(parseISO(entry.start_time))
      
      if (!patterns[hour]) {
        patterns[hour] = {
          totalSessions: 0,
          totalDuration: 0,
          productivitySum: 0,
          dayDistribution: {}
        }
      }
      
      patterns[hour].totalSessions += 1
      patterns[hour].totalDuration += entry.duration || 0
      patterns[hour].productivitySum += entry.is_billable ? 1 : 0
      
      if (!patterns[hour].dayDistribution[dayOfWeek]) {
        patterns[hour].dayDistribution[dayOfWeek] = 0
      }
      patterns[hour].dayDistribution[dayOfWeek] += 1
      
      return patterns
    }, {} as Record<number, any>)

    return Object.entries(hourlyPatterns).map(([hour, data]) => ({
      hour: parseInt(hour),
      averageProductivity: data.totalSessions > 0 ? (data.productivitySum / data.totalSessions) * 100 : 0,
      totalSessions: data.totalSessions,
      averageSessionLength: data.totalSessions > 0 ? (data.totalDuration / data.totalSessions) / 3600 : 0
    })).sort((a, b) => a.hour - b.hour)
  }, [filteredTimeEntries])

  return {
    loading,
    productivityMetrics,
    projectAnalytics,
    clientAnalytics,
    timePatterns,
    dateRange,
    filteredTimeEntries
  }
}