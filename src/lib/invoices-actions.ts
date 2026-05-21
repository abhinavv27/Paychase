'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase/types'

type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

export async function createInvoiceAction(
  _prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const invoiceData: InvoiceInsert = {
    user_id: user.id,
    client_id: formData.get('client_id') as string,
    invoice_number: formData.get('invoice_number') as string,
    amount: parseFloat(formData.get('amount') as string),
    currency: (formData.get('currency') as string) || 'INR',
    issue_date: formData.get('issue_date') as string,
    due_date: formData.get('due_date') as string,
    status: 'pending',
  }

  if (!invoiceData.client_id || !invoiceData.invoice_number || !invoiceData.amount) {
    return { success: false, error: 'Missing required fields' }
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/invoices')
  redirect('/invoices')
}

export async function updateInvoiceAction(
  id: string,
  _prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const invoiceData: InvoiceUpdate = {
    client_id: formData.get('client_id') as string,
    invoice_number: formData.get('invoice_number') as string,
    amount: parseFloat(formData.get('amount') as string),
    currency: (formData.get('currency') as string) || 'INR',
    issue_date: formData.get('issue_date') as string,
    due_date: formData.get('due_date') as string,
  }

  const { error } = await supabase
    .from('invoices')
    .update(invoiceData)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/invoices')
  redirect('/invoices')
}

export async function deleteInvoiceAction(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/invoices')
  return { success: true }
}
