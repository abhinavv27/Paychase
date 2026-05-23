'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase/types'

type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

export async function createInvoiceAction(
  _prevState: Record<string, unknown>,
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

  if (isNaN(invoiceData.amount)) {
    return { success: false, error: 'Invalid amount' }
  }

  if (!invoiceData.client_id || !invoiceData.invoice_number) {
    return { success: false, error: 'Missing required fields' }
  }

  try {
    const { error } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'An invoice with this number already exists.' }
      }
      return { success: false, error: error.message }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save invoice' }
  }

  revalidatePath('/invoices')
  redirect('/invoices')
}

export async function updateInvoiceAction(
  id: string,
  _prevState: Record<string, unknown>,
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

  if (invoiceData.amount !== undefined && isNaN(invoiceData.amount)) {
    return { success: false, error: 'Invalid amount' }
  }

  try {
    const { error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update invoice' }
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
