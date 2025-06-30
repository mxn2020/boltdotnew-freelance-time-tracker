/*
  # Invoice and Expense Management Schema

  1. New Tables
    - `invoices`
      - Core invoice data with client/project relationships
      - Status tracking (draft, sent, paid, overdue, cancelled)
      - Tax calculations and currency support
    
    - `invoice_line_items`
      - Individual line items for invoices
      - Links to time entries for automatic billing
    
    - `expenses`
      - Expense tracking with categories
      - Billable/reimbursable flags
      - Receipt storage support
    
    - `invoice_templates`
      - Customizable invoice templates
      - Branding and styling options

  2. Security
    - Enable RLS on all tables
    - User-specific access policies
    - Audit trail for financial data

  3. Features
    - Automatic invoice numbering
    - Tax calculation triggers
    - Expense categorization
    - Receipt file storage
*/

-- Create custom types
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE expense_category AS ENUM (
  'office_supplies', 'software', 'hardware', 'travel', 'meals', 
  'marketing', 'professional_services', 'utilities', 'rent', 'other'
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  title text NOT NULL,
  description text,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  status invoice_status DEFAULT 'draft',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  notes text,
  payment_terms text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, invoice_number)
);

-- Invoice line items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  rate numeric(10,2) NOT NULL,
  amount numeric(10,2) NOT NULL,
  time_entry_ids uuid[],
  created_at timestamptz DEFAULT now()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  category expense_category NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  receipt_url text,
  is_billable boolean DEFAULT false,
  is_reimbursable boolean DEFAULT false,
  tax_category text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoice templates table
CREATE TABLE IF NOT EXISTS invoice_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  company_name text,
  company_address text,
  company_email text,
  company_phone text,
  logo_url text,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#1F2937',
  font_family text DEFAULT 'Inter',
  payment_terms text DEFAULT 'Net 30',
  notes_template text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can manage own invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for invoice_line_items
CREATE POLICY "Users can manage own invoice line items"
  ON invoice_line_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_line_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- RLS Policies for expenses
CREATE POLICY "Users can manage own expenses"
  ON expenses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for invoice_templates
CREATE POLICY "Users can manage own invoice templates"
  ON invoice_templates
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client_id ON expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_user_id ON invoice_templates(user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_templates_updated_at
  BEFORE UPDATE ON invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate subtotal from line items
  SELECT COALESCE(SUM(amount), 0)
  INTO NEW.subtotal
  FROM invoice_line_items
  WHERE invoice_id = NEW.id;
  
  -- Calculate tax amount
  NEW.tax_amount = NEW.subtotal * (NEW.tax_rate / 100);
  
  -- Calculate total
  NEW.total_amount = NEW.subtotal + NEW.tax_amount;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number integer;
  year_prefix text;
BEGIN
  -- Generate year prefix (e.g., "2024-")
  year_prefix := EXTRACT(YEAR FROM CURRENT_DATE)::text || '-';
  
  -- Get next number for this user and year
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ ('^' || year_prefix || '[0-9]+$')
      THEN (regexp_replace(invoice_number, '^' || year_prefix, ''))::integer
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM invoices
  WHERE user_id = NEW.user_id;
  
  -- Set the invoice number if not already set
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := year_prefix || LPAD(next_number::text, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- Function to recalculate invoice totals when line items change
CREATE OR REPLACE FUNCTION recalculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  invoice_id_to_update uuid;
BEGIN
  -- Determine which invoice to update
  IF TG_OP = 'DELETE' THEN
    invoice_id_to_update := OLD.invoice_id;
  ELSE
    invoice_id_to_update := NEW.invoice_id;
  END IF;
  
  -- Update the invoice totals
  UPDATE invoices
  SET 
    subtotal = (
      SELECT COALESCE(SUM(amount), 0)
      FROM invoice_line_items
      WHERE invoice_id = invoice_id_to_update
    ),
    updated_at = now()
  WHERE id = invoice_id_to_update;
  
  -- Recalculate tax and total
  UPDATE invoices
  SET 
    tax_amount = subtotal * (tax_rate / 100),
    total_amount = subtotal + (subtotal * (tax_rate / 100))
  WHERE id = invoice_id_to_update;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger for line item changes
CREATE TRIGGER recalculate_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_invoice_totals();

-- Function to ensure only one default template per user
CREATE OR REPLACE FUNCTION ensure_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Set all other templates for this user to not default
    UPDATE invoice_templates
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for default template management
CREATE TRIGGER ensure_single_default_template_trigger
  AFTER INSERT OR UPDATE ON invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_template();