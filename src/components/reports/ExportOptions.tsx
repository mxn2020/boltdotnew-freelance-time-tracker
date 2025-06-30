import React from 'react'
import { Button } from '../ui/Button'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Download, FileText, Table, Calendar } from 'lucide-react'
import { TimeEntry } from '../../types/projects'
import { formatDuration, formatCurrency, calculateEarnings } from '../../utils/timeUtils'
import { format } from 'date-fns'

interface ExportOptionsProps {
  timeEntries: TimeEntry[]
  dateRange: string
  filters: any
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  timeEntries,
  dateRange,
  filters
}) => {
  const exportToCsv = () => {
    const headers = [
      'Date',
      'Project',
      'Client',
      'Description',
      'Start Time',
      'End Time',
      'Duration',
      'Billable',
      'Hourly Rate',
      'Earnings'
    ]

    const rows = timeEntries.map(entry => [
      format(new Date(entry.start_time), 'yyyy-MM-dd'),
      entry.project?.name || '',
      entry.project?.client?.name || '',
      entry.description || '',
      format(new Date(entry.start_time), 'HH:mm:ss'),
      entry.end_time ? format(new Date(entry.end_time), 'HH:mm:ss') : '',
      formatDuration(entry.duration || 0),
      entry.is_billable ? 'Yes' : 'No',
      entry.hourly_rate || entry.project?.hourly_rate || 0,
      entry.is_billable ? calculateEarnings(entry.duration || 0, entry.hourly_rate || entry.project?.hourly_rate || 0) : 0
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `time-report-${dateRange.replace(/\s+/g, '-').toLowerCase()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJson = () => {
    const exportData = {
      dateRange,
      filters,
      summary: {
        totalEntries: timeEntries.length,
        totalTime: timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0),
        billableTime: timeEntries.filter(e => e.is_billable).reduce((sum, entry) => sum + (entry.duration || 0), 0),
        totalEarnings: timeEntries
          .filter(e => e.is_billable)
          .reduce((sum, entry) => sum + calculateEarnings(entry.duration || 0, entry.hourly_rate || entry.project?.hourly_rate || 0), 0)
      },
      entries: timeEntries.map(entry => ({
        id: entry.id,
        date: format(new Date(entry.start_time), 'yyyy-MM-dd'),
        project: entry.project?.name,
        client: entry.project?.client?.name,
        description: entry.description,
        startTime: entry.start_time,
        endTime: entry.end_time,
        duration: entry.duration,
        isBillable: entry.is_billable,
        hourlyRate: entry.hourly_rate || entry.project?.hourly_rate,
        earnings: entry.is_billable ? calculateEarnings(entry.duration || 0, entry.hourly_rate || entry.project?.hourly_rate || 0) : 0
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `time-report-${dateRange.replace(/\s+/g, '-').toLowerCase()}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generatePdfReport = () => {
    // For now, we'll create a simple HTML report that can be printed as PDF
    const reportWindow = window.open('', '_blank')
    if (!reportWindow) return

    const totalSeconds = timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const billableSeconds = timeEntries.filter(e => e.is_billable).reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const totalEarnings = timeEntries
      .filter(e => e.is_billable)
      .reduce((sum, entry) => sum + calculateEarnings(entry.duration || 0, entry.hourly_rate || entry.project?.hourly_rate || 0), 0)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Time Report - ${dateRange}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 24px; font-weight: bold; color: #333; }
            .summary-label { color: #666; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .text-right { text-align: right; }
            .billable { color: #059669; }
            .non-billable { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Time Tracking Report</h1>
            <p><strong>Period:</strong> ${dateRange}</p>
            <p><strong>Generated:</strong> ${format(new Date(), 'MMMM d, yyyy at h:mm a')}</p>
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value">${formatDuration(totalSeconds)}</div>
                <div class="summary-label">Total Time</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${formatDuration(billableSeconds)}</div>
                <div class="summary-label">Billable Time</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${formatCurrency(totalEarnings)}</div>
                <div class="summary-label">Total Earnings</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${timeEntries.length}</div>
                <div class="summary-label">Time Entries</div>
              </div>
            </div>
          </div>

          <h2>Detailed Time Entries</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                <th>Client</th>
                <th>Description</th>
                <th>Duration</th>
                <th>Type</th>
                <th class="text-right">Earnings</th>
              </tr>
            </thead>
            <tbody>
              ${timeEntries.map(entry => `
                <tr>
                  <td>${format(new Date(entry.start_time), 'MMM d, yyyy')}</td>
                  <td>${entry.project?.name || ''}</td>
                  <td>${entry.project?.client?.name || ''}</td>
                  <td>${entry.description || ''}</td>
                  <td>${formatDuration(entry.duration || 0)}</td>
                  <td class="${entry.is_billable ? 'billable' : 'non-billable'}">
                    ${entry.is_billable ? 'Billable' : 'Non-billable'}
                  </td>
                  <td class="text-right">
                    ${entry.is_billable ? formatCurrency(calculateEarnings(entry.duration || 0, entry.hourly_rate || entry.project?.hourly_rate || 0)) : '-'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    reportWindow.document.write(htmlContent)
    reportWindow.document.close()
    
    // Auto-print after a short delay
    setTimeout(() => {
      reportWindow.print()
    }, 500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Download className="w-5 h-5 mr-2" />
          Export Report
        </CardTitle>
      </CardHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          icon={Table}
          onClick={exportToCsv}
          className="w-full"
        >
          Export CSV
        </Button>
        
        <Button
          variant="outline"
          icon={FileText}
          onClick={generatePdfReport}
          className="w-full"
        >
          Generate PDF
        </Button>
        
        <Button
          variant="outline"
          icon={Calendar}
          onClick={exportToJson}
          className="w-full"
        >
          Export JSON
        </Button>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>CSV:</strong> Spreadsheet-compatible format for further analysis</p>
        <p><strong>PDF:</strong> Professional report for client sharing</p>
        <p><strong>JSON:</strong> Structured data for integrations and backups</p>
      </div>
    </Card>
  )
}