import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']
type InvoiceRow = Database['public']['Tables']['invoices']['Row']

export async function getInvoices(): Promise<(InvoiceRow & { client: { name: string } })[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getInvoice(id: string): Promise<InvoiceRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createInvoice(invoice: InvoiceInsert): Promise<InvoiceRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .insert(invoice)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateInvoice(id: string, invoice: InvoiceUpdate): Promise<InvoiceRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .update(invoice)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteInvoice(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getInvoicesByStatus(status: string): Promise<InvoiceRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('status', status)
    .order('due_date', { ascending: true })
  if (error) throw error
  return data
}

export async function getOverdueInvoices(): Promise<InvoiceRow[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('status', 'pending')
    .lt('due_date', today)
    .order('due_date', { ascending: true })
  if (error) throw error
  return data
}
