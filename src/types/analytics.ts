// src/types/analytics.ts

export interface ProductivityMetrics {
  totalHours: number
  billableHours: number
  productivityRate: number
  averageSessionLength: number
  peakProductivityHours: number[]
  dailyAverages: DailyAverage[]
  weeklyTrends: WeeklyTrend[]
  monthlyComparison: MonthlyComparison[]
}

export interface DailyAverage {
  dayOfWeek: number
  dayName: string
  averageHours: number
  averageSessions: number
  productivityScore: number
}

export interface WeeklyTrend {
  weekStart: string
  totalHours: number
  billableHours: number
  earnings: number
  sessionsCount: number
  productivityScore: number
}

export interface MonthlyComparison {
  month: string
  year: number
  totalHours: number
  billableHours: number
  earnings: number
  projectsWorked: number
  averageHourlyRate: number
  growthRate: number
}

export interface ProjectAnalytics {
  projectId: string
  projectName: string
  clientName?: string
  totalHours: number
  billableHours: number
  earnings: number
  profitability: number
  averageHourlyRate: number
  timeDistribution: TimeDistribution[]
  completionRate: number
  budgetUtilization?: number
}

export interface ClientAnalytics {
  clientId: string
  clientName: string
  totalHours: number
  billableHours: number
  earnings: number
  projectsCount: number
  averageProjectValue: number
  responseTime: number
  satisfactionScore?: number
  projects: ProjectAnalytics[]
}

export interface TimeDistribution {
  date: string
  hours: number
  sessions: number
  productivity: number
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string
  type: 'hours' | 'earnings' | 'projects' | 'clients' | 'productivity'
  target_value: number
  current_value: number
  target_date: string
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface CreateGoalData {
  title: string
  description?: string
  type: Goal['type']
  target_value: number
  target_date: string
}

export interface ProductivityInsight {
  id: string
  type: 'recommendation' | 'achievement' | 'warning' | 'trend'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
  action_text?: string
  data?: any
  is_read: boolean
  created_at: string
}

export interface TimePattern {
  hour: number
  averageProductivity: number
  totalSessions: number
  averageSessionLength: number
  dayOfWeek?: number
}

export interface AnalyticsFilters {
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'custom'
  startDate?: string
  endDate?: string
  projectIds?: string[]
  clientIds?: string[]
  includeNonBillable?: boolean
}