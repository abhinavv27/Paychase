import { createClient } from '@/lib/supabase/server'
import Papa from 'papaparse'

export interface CsvRow {
  client_name: string
  amount: number
  due_date: string
  invoice_number?: string
  client_phone?: string
  client_email?: string
}

export interface ImportResult {
  imported: number
  errors: { row: number; message: string }[]
  skipped: number
}

export async function parseCsvContent(content: string): Promise<{ rows: CsvRow[]; errors: ImportResult['errors'] }> {
  return new Promise((resolve) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const errors: ImportResult['errors'] = []
        const rows: CsvRow[] = []

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as Record<string, unknown>
          const rowNum = i + 2

          if (!row.client_name || !row.amount) {
            errors.push({ row: rowNum, message: 'Missing required fields: client_name, amount' })
            continue
          }

          if (!row.due_date) {
            errors.push({ row: rowNum, message: 'Missing required field: due_date' })
            continue
          }

          const amount = Number(row.amount)
          if (isNaN(amount) || amount <= 0) {
            errors.push({ row: rowNum, message: `Invalid amount: ${row.amount}` })
            continue
          }

          rows.push({
            client_name: String(row.client_name),
            amount,
            due_date: String(row.due_date),
            invoice_number: row.invoice_number ? String(row.invoice_number) : undefined,
            client_phone: row.client_phone ? String(row.client_phone) : undefined,
            client_email: row.client_email ? String(row.client_email) : undefined,
          })
        }

        resolve({ rows, errors })
      },
      error: (err) => {
        resolve({ rows: [], errors: [{ row: 1, message: err.message }] })
      },
    })
  })
}

export async function importCsvRows(rows: CsvRow[], userId: string): Promise<ImportResult> {
  const supabase = createClient()
  const result: ImportResult = { imported: 0, errors: [], skipped: 0 }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    try {
      let clientId: string | null = null

      if (row.client_phone) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('phone', row.client_phone)
          .eq('user_id', userId)
          .maybeSingle()
        if (existing) clientId = existing.id
      }

      if (!clientId) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('name', row.client_name)
          .eq('user_id', userId)
          .maybeSingle()
        if (existing) clientId = existing.id
      }

      if (!clientId) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: userId,
            name: row.client_name,
            phone: row.client_phone || null,
            email: row.client_email || null,
            consent_given: true,
            consent_date: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (clientError || !newClient) {
          result.errors.push({ row: rowNum, message: `Failed to create client: ${clientError?.message}` })
          continue
        }
        clientId = newClient.id
      }

      if (row.invoice_number) {
        const { data: existing } = await supabase
          .from('invoices')
          .select('id')
          .eq('invoice_number', row.invoice_number)
          .eq('user_id', userId)
          .maybeSingle()
        if (existing) {
          result.errors.push({ row: rowNum, message: `Duplicate invoice number: ${row.invoice_number}` })
          continue
        }
      }

      const { error: invoiceError } = await supabase.from('invoices').insert({
        user_id: userId,
        client_id: clientId,
        amount: row.amount,
        due_date: row.due_date,
        invoice_number: row.invoice_number || `INV-${Date.now()}-${i}`,
        status: 'pending',
        issue_date: new Date().toISOString(),
      })

      if (invoiceError) {
        result.errors.push({ row: rowNum, message: `Failed to create invoice: ${invoiceError.message}` })
        continue
      }

      result.imported++
    } catch (err) {
      result.errors.push({ row: rowNum, message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}` })
    }
  }

  return result
}
