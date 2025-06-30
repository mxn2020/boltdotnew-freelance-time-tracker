// src/components/invoices/InvoiceCard.tsx
import React from 'react'
import { Invoice } from '../../types/invoices'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { FileText, Eye, Edit, Trash2, Send, DollarSign, Calendar, User } from 'lucide-react'
import { formatCurrency } from '../../utils/timeUtils'
import { format } from 'date-fns'

interface InvoiceCardProps {
  invoice: Invoice
  onView: (invoice: Invoice) => void
  onEdit: (invoice: Invoice) => void
  onDelete: (invoice: Invoice) => void
  onUpdateStatus: (invoice: Invoice, status: Invoice['status']) => void
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
  onView,
  onEdit,
  onDelete,
  onUpdateStatus
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = invoice.status === 'sent' && new Date(invoice.due_date) < new Date()

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <FileText className="w-5 h-5 text-blue-600 mr-2" />
          <div>
            <h3 className="font-semibold text-gray-900">{invoice.title}</h3>
            <p className="text-sm text-gray-500">#{invoice.invoice_number}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(isOverdue ? 'overdue' : invoice.status)}`}>
          {isOverdue ? 'Overdue' : invoice.status}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {invoice.client && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span>{invoice.client.name}</span>
            {invoice.client.company && (
              <span className="ml-1">({invoice.client.company})</span>
            )}
          </div>
        )}

        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <DollarSign className="w-4 h-4 mr-2" />
          <span className="font-medium text-gray-900">
            {formatCurrency(invoice.total_amount)}
          </span>
          <span className="ml-1">({invoice.currency})</span>
        </div>
      </div>

      {invoice.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {invoice.description}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={Eye}
          onClick={() => onView(invoice)}
          className="flex-1"
        >
          View
        </Button>
        
        {invoice.status === 'draft' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={() => onEdit(invoice)}
            />
            <Button
              variant="outline"
              size="sm"
              icon={Send}
              onClick={() => onUpdateStatus(invoice, 'sent')}
            />
          </>
        )}
        
        {invoice.status === 'sent' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateStatus(invoice, 'paid')}
            className="text-green-600 hover:text-green-700"
          >
            Mark Paid
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          onClick={() => onDelete(invoice)}
          className="text-red-600 hover:text-red-700"
        />
      </div>
    </Card>
  )
}