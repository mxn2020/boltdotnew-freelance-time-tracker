export const formatDuration = (seconds: number): string => {
  if (seconds < 0) return '0:00:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const formatDurationShort = (seconds: number): string => {
  if (seconds < 0) return '0h 0m'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours === 0) {
    return `${minutes}m`
  }
  
  return `${hours}h ${minutes}m`
}

export const parseDuration = (timeString: string): number => {
  // Parse formats like "1:30:00", "1h 30m", "90m", etc.
  const colonFormat = timeString.match(/^(\d+):(\d+):(\d+)$/)
  if (colonFormat) {
    const [, hours, minutes, seconds] = colonFormat
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)
  }
  
  const hourMinuteFormat = timeString.match(/^(\d+)h\s*(\d+)m$/)
  if (hourMinuteFormat) {
    const [, hours, minutes] = hourMinuteFormat
    return parseInt(hours) * 3600 + parseInt(minutes) * 60
  }
  
  const minuteFormat = timeString.match(/^(\d+)m$/)
  if (minuteFormat) {
    const [, minutes] = minuteFormat
    return parseInt(minutes) * 60
  }
  
  return 0
}

export const calculateEarnings = (seconds: number, hourlyRate: number): number => {
  const hours = seconds / 3600
  return hours * hourlyRate
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export const isTimeOverlapping = (
  start1: string,
  end1: string | null,
  start2: string,
  end2: string | null
): boolean => {
  const startTime1 = new Date(start1).getTime()
  const endTime1 = end1 ? new Date(end1).getTime() : Date.now()
  const startTime2 = new Date(start2).getTime()
  const endTime2 = end2 ? new Date(end2).getTime() : Date.now()
  
  return startTime1 < endTime2 && startTime2 < endTime1
}

export const getTodayTimeRange = (): { start: string; end: string } => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  
  return {
    start: start.toISOString(),
    end: end.toISOString()
  }
}