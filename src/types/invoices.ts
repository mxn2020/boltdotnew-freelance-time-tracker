// src/types/invoices.ts

export interface Invoice {
  id: string
  user_id: string
  client_id?: string
  project_id?: string
  invoice_number: string
  title: string
  description?: string
  issue_date: string
  due_date: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  currency: string
  notes?: string
  payment_terms?: string
  created_at: string
  updated_at: string
  client?: {
    id: string
    name: string
    email?: string
    company?: string
    address?: string
  }
  project?: {
    id: string
    name: string
  }
  line_items: InvoiceLineItem[]
}

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  rate: number
  amount: number
  time_entry_ids?: string[]
  created_at: string
}

export interface Expense {
  id: string
  user_id: string
  project_id?: string
  client_id?: string
  category: string
  description: string
  amount: number
  currency: string
  expense_date: string
  receipt_url?: string
  is_billable: boolean
  is_reimbursable: boolean
  tax_category?: string
  notes?: string
  created_at: string
  updated_at: string
  project?: {
    id: string
    name: string
  }
  client?: {
    id: string
    name: string
  }
}

export interface CreateInvoiceData {
  client_id?: string
  project_id?: string
  title: string
  description?: string
  due_date: string
  tax_rate?: number
  currency?: string
  notes?: string
  payment_terms?: string
  line_items: CreateInvoiceLineItemData[]
}

export interface CreateInvoiceLineItemData {
  description: string
  quantity: number
  rate: number
  time_entry_ids?: string[]
}

export interface CreateExpenseData {
  project_id?: string
  client_id?: string
  category: string
  description: string
  amount: number
  currency?: string
  expense_date: string
  is_billable?: boolean
  is_reimbursable?: boolean
  tax_category?: string
  notes?: string
}

export interface InvoiceTemplate {
  id: string
  user_id: string
  name: string
  is_default: boolean
  company_name?: string
  company_address?: string
  company_email?: string
  company_phone?: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  font_family: string
  payment_terms: string
  notes_template?: string
  created_at: string
  updated_at: string
}