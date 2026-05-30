'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Database } from '@/lib/supabase/types'
import { createPaymentLink } from '@/lib/razorpay'

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

  let newInvoiceId: string | undefined

  try {
    const { data: inserted, error } = await supabase
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

    newInvoiceId = (inserted as { id: string } | null)?.id
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to save invoice' }
  }

  if (newInvoiceId) {
    try {
      const { data: client } = await supabase
        .from('clients')
        .select('name, email, phone')
        .eq('id', invoiceData.client_id)
        .eq('user_id', user.id)
        .single()

      if (client) {
        const clientData = client as { name: string; email: string | null; phone: string | null }
        const paymentLink = await createPaymentLink({
          amount: invoiceData.amount,
          currency: invoiceData.currency || 'INR',
          description: `Invoice ${invoiceData.invoice_number}`,
          customer: {
            name: clientData.name,
            email: clientData.email || undefined,
            phone: clientData.phone || undefined,
          },
          notes: {
            invoice_id: newInvoiceId,
            user_id: user.id,
          },
        })

        if (paymentLink?.short_url) {
          await supabase
            .from('invoices')
            .update({ upi_link: paymentLink.short_url })
            .eq('id', newInvoiceId)
        }
      }
    } catch {
      await supabase.from('invoices').delete().eq('id', newInvoiceId).eq('user_id', user.id)
      return { success: false, error: 'Invoice created but payment link generation failed. Please try again.' }
    }
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

export async function regenerateInvoicePaymentLinkAction(invoiceId: string): Promise<{ success?: boolean; error?: string; url?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, client:clients(name, email, phone)')
    .eq('id', invoiceId)
    .eq('user_id', user.id)
    .single()

  if (invoiceError || !invoice) return { error: 'Invoice not found' }

  const typedInvoice = invoice as unknown as {
    id: string
    amount: number
    currency: string
    invoice_number: string
    client: { name: string; email: string | null; phone: string | null } | null
  }

  const client = typedInvoice.client

  try {
    const link = await createPaymentLink({
      amount: typedInvoice.amount,
      currency: typedInvoice.currency,
      description: `Payment for invoice ${typedInvoice.invoice_number}`,
      customer: {
        name: client?.name || 'Customer',
        email: client?.email || undefined,
        phone: client?.phone || undefined,
      },
      notes: {
        invoice_id: typedInvoice.id,
        user_id: user.id,
      },
    })

    await supabase
      .from('invoices')
      .update({ upi_link: link.short_url })
      .eq('id', typedInvoice.id)

    revalidatePath(`/invoices/${invoiceId}/edit`)
    return { success: true, url: link.short_url }
  } catch (error) {
    console.error('Failed to create payment link:', error)
    return { error: 'Failed to create payment link' }
  }
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
