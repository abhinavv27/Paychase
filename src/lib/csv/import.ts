import { parse } from 'csv-parse/sync'
import type { Database } from '@/lib/supabase/types'

type ClientInsert = Database['public']['Tables']['clients']['Insert']
type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']

export interface CsvRow {
  name: string
  phone?: string
  email?: string
  industry?: string
  invoice_number?: string
  amount?: string
  issue_date?: string
  due_date?: string
}

export interface InvoiceInsertWithClientName extends InvoiceInsert {
  _clientName: string
}

export interface ValidationResult {
  valid: boolean
  clients: ClientInsert[]
  invoices: InvoiceInsertWithClientName[]
  errors: { row: number; field: string; message: string }[]
  warnings: { row: number; field: string; message: string }[]
}

export function validateCsvContent(content: string, userId: string): ValidationResult {
  const errors: { row: number; field: string; message: string }[] = []
  const warnings: { row: number; field: string; message: string }[] = []
  const clients: ClientInsert[] = []
  const invoices: InvoiceInsertWithClientName[] = []

  let records: CsvRow[]
  try {
    records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
  } catch (e) {
    return {
      valid: false,
      clients: [],
      invoices: [],
      errors: [{ row: 0, field: 'file', message: 'Invalid CSV format' }],
      warnings: [],
    }
  }

  if (!Array.isArray(records) || records.length === 0) {
    return {
      valid: true,
      clients: [],
      invoices: [],
      errors: [],
      warnings: [],
    }
  }

  const clientMap = new Map<string, ClientInsert>()

  for (let i = 0; i < records.length; i++) {
    const row = records[i]
    const rowNum = i + 2 // 1-indexed, skip header

    // Validate required fields
    if (!row.name) {
      errors.push({ row: rowNum, field: 'name', message: 'Client name is required' })
      continue
    }

    // Validate email format if provided
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ row: rowNum, field: 'email', message: 'Invalid email format' })
    }

    // Validate phone format if provided
    if (row.phone && !/^\+?\d{10,15}$/.test(row.phone.replace(/\s/g, ''))) {
      warnings.push({ row: rowNum, field: 'phone', message: 'Phone number may be invalid' })
    }

    // Build or update client record
    if (!clientMap.has(row.name.toLowerCase())) {
      const client: ClientInsert = {
        user_id: userId,
        name: row.name,
        phone: row.phone || null,
        email: row.email || null,
        industry: row.industry || null,
      }
      clientMap.set(row.name.toLowerCase(), client)
    }

    // Build invoice record if invoice data present
    if (row.invoice_number && row.amount) {
      const amount = parseFloat(row.amount)
      if (isNaN(amount) || amount <= 0) {
        errors.push({ row: rowNum, field: 'amount', message: 'Invalid amount' })
        continue
      }

      const issueDate = row.issue_date || new Date().toISOString().split('T')[0]
      const dueDate = row.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      invoices.push({
        user_id: userId,
        client_id: '', // Will be set after client creation
        invoice_number: row.invoice_number,
        amount,
        currency: 'INR',
        issue_date: issueDate,
        due_date: dueDate,
        status: 'pending',
        _clientName: row.name,
      } as InvoiceInsertWithClientName)
    }
  }

  clients.push(...Array.from(clientMap.values()))

  return {
    valid: errors.length === 0,
    clients,
    invoices,
    errors,
    warnings,
  }
}
