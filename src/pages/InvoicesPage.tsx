// src/pages/InvoicesPage.tsx
import React, { useState } from 'react'
import { useInvoices } from '../hooks/useInvoices'
import { InvoiceForm } from '../components/invoices/InvoiceForm'
import { InvoiceCard } from '../components/invoices/InvoiceCard'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Plus, FileText, DollarSign, Clock, AlertCircle } from 'lucide-react'
import { Invoice, CreateInvoiceData } from '../types/invoices'
import { formatCurrency } from '../utils/timeUtils'

export const InvoicesPage: React.FC = () => {
  const { 
    invoices, 
    loading, 
    createInvoice, 
    updateInvoice, 
    deleteInvoice, 
    updateInvoiceStatus 
  } = useInvoices()
  
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  const handleCreateInvoice = async (data: CreateInvoiceData) => {
    await createInvoice(data)
    setShowForm(false)
  }

  const handleUpdateInvoice = async (data: CreateInvoiceData) => {
    if (editingInvoice) {
      await updateInvoice(editingInvoice.id, data)
      setEditingInvoice(null)
    }
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setShowForm(true)
  }

  const handleViewInvoice = (invoice: Invoice) => {
    // TODO: Navigate to invoice details/preview page
    console.log('View invoice:', invoice)
  }

  const handleDeleteInvoice = async (invoice: Invoice) => {
    if (window.confirm(`Are you sure you want to delete invoice "${invoice.title}"?`)) {
      await deleteInvoice(invoice.id)
    }
  }

  const handleUpdateStatus = async (invoice: Invoice, status: Invoice['status']) => {
    await updateInvoiceStatus(invoice.id, status)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingInvoice(null)
  }

  // Calculate stats
  const stats = {
    total: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    paid: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0),
    pending: invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.total_amount, 0),
    overdue: invoices.filter(inv => inv.status === 'sent' && new Date(inv.due_date) < new Date()).length
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
          </h1>
        </div>

        <InvoiceForm
          initialData={editingInvoice ? {
            client_id: editingInvoice.client_id,
            project_id: editingInvoice.project_id,
            title: editingInvoice.title,
            description: editingInvoice.description,
            due_date: editingInvoice.due_date,
            tax_rate: editingInvoice.tax_rate,
            currency: editingInvoice.currency,
            notes: editingInvoice.notes,
            payment_terms: editingInvoice.payment_terms,
            line_items: editingInvoice.line_items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              time_entry_ids: item.time_entry_ids
            }))
          } : undefined}
          onSubmit={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
          onCancel={handleCancelForm}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage your invoices and track payments</p>
        </div>
        <Button
          icon={Plus}
          onClick={() => setShowForm(true)}
        >
          Create Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.total)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Paid</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.paid)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.pending)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overdue}</p>
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
          <p className="text-gray-500 mb-4">Create your first invoice to start billing clients</p>
          <Button
            icon={Plus}
            onClick={() => setShowForm(true)}
          >
            Create Invoice
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onView={handleViewInvoice}
              onEdit={handleEditInvoice}
              onDelete={handleDeleteInvoice}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}