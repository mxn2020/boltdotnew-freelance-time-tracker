import { TimeEntry } from '../types/projects'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export interface DateRange {
  start: Date
  end: Date
  label: string
}

export const getDateRanges = (): Record<string, DateRange> => {
  const now = new Date()
  
  return {
    today: {
      start: startOfDay(now),
      end: endOfDay(now),
      label: 'Today'
    },
    thisWeek: {
      start: startOfWeek(now),
      end: endOfWeek(now),
      label: 'This Week'
    },
    thisMonth: {
      start: startOfMonth(now),
      end: endOfMonth(now),
      label: 'This Month'
    },
    last7Days: {
      start: startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)),
      end: endOfDay(now),
      label: 'Last 7 Days'
    },
    last30Days: {
      start: startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
      end: endOfDay(now),
      label: 'Last 30 Days'
    }
  }
}

export const filterTimeEntriesByDateRange = (
  timeEntries: TimeEntry[],
  dateRange: DateRange
): TimeEntry[] => {
  return timeEntries.filter(entry => {
    const entryDate = new Date(entry.start_time)
    return entryDate >= dateRange.start && entryDate <= dateRange.end
  })
}

export const groupTimeEntriesByDate = (timeEntries: TimeEntry[]): Record<string, TimeEntry[]> => {
  return timeEntries.reduce((groups, entry) => {
    const date = format(new Date(entry.start_time), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(entry)
    return groups
  }, {} as Record<string, TimeEntry[]>)
}

export const groupTimeEntriesByProject = (timeEntries: TimeEntry[]): Record<string, TimeEntry[]> => {
  return timeEntries.reduce((groups, entry) => {
    const projectName = entry.project?.name || 'Unknown Project'
    if (!groups[projectName]) {
      groups[projectName] = []
    }
    groups[projectName].push(entry)
    return groups
  }, {} as Record<string, TimeEntry[]>)
}

export const groupTimeEntriesByClient = (timeEntries: TimeEntry[]): Record<string, TimeEntry[]> => {
  return timeEntries.reduce((groups, entry) => {
    const clientName = entry.project?.client?.name || 'No Client'
    if (!groups[clientName]) {
      groups[clientName] = []
    }
    groups[clientName].push(entry)
    return groups
  }, {} as Record<string, TimeEntry[]>)
}

export const calculateProjectStats = (timeEntries: TimeEntry[]) => {
  const projectGroups = groupTimeEntriesByProject(timeEntries)
  
  return Object.entries(projectGroups).map(([projectName, entries]) => {
    const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const billableSeconds = entries
      .filter(entry => entry.is_billable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)
    
    const totalEarnings = entries
      .filter(entry => entry.is_billable)
      .reduce((sum, entry) => {
        const rate = entry.hourly_rate || entry.project?.hourly_rate || 0
        return sum + ((entry.duration || 0) / 3600) * rate
      }, 0)

    return {
      projectName,
      totalSeconds,
      billableSeconds,
      totalEarnings,
      entryCount: entries.length,
      averageSessionLength: entries.length > 0 ? totalSeconds / entries.length : 0
    }
  }).sort((a, b) => b.totalSeconds - a.totalSeconds)
}

export const calculateClientStats = (timeEntries: TimeEntry[]) => {
  const clientGroups = groupTimeEntriesByClient(timeEntries)
  
  return Object.entries(clientGroups).map(([clientName, entries]) => {
    const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const billableSeconds = entries
      .filter(entry => entry.is_billable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)
    
    const totalEarnings = entries
      .filter(entry => entry.is_billable)
      .reduce((sum, entry) => {
        const rate = entry.hourly_rate || entry.project?.hourly_rate || 0
        return sum + ((entry.duration || 0) / 3600) * rate
      }, 0)

    const uniqueProjects = new Set(entries.map(entry => entry.project_id)).size

    return {
      clientName,
      totalSeconds,
      billableSeconds,
      totalEarnings,
      entryCount: entries.length,
      projectCount: uniqueProjects,
      averageSessionLength: entries.length > 0 ? totalSeconds / entries.length : 0
    }
  }).sort((a, b) => b.totalSeconds - a.totalSeconds)
}

export const calculateDailyProductivity = (timeEntries: TimeEntry[]) => {
  const dailyGroups = groupTimeEntriesByDate(timeEntries)
  
  return Object.entries(dailyGroups).map(([date, entries]) => {
    const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const billableSeconds = entries
      .filter(entry => entry.is_billable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)
    
    const totalEarnings = entries
      .filter(entry => entry.is_billable)
      .reduce((sum, entry) => {
        const rate = entry.hourly_rate || entry.project?.hourly_rate || 0
        return sum + ((entry.duration || 0) / 3600) * rate
      }, 0)

    return {
      date,
      totalSeconds,
      billableSeconds,
      totalEarnings,
      entryCount: entries.length,
      productivityRatio: totalSeconds > 0 ? billableSeconds / totalSeconds : 0
    }
  }).sort((a, b) => a.date.localeCompare(b.date))
}