'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function batchMarkAsPaid(invoiceIds: string[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      payment_date: new Date().toISOString(),
    })
    .in('id', invoiceIds)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/invoices')
  return { success: true, count: invoiceIds.length }
}

export async function batchGenerateDrafts(invoiceIds: string[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, client:clients(name, phone, on_time_rate)')
    .in('id', invoiceIds)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (!invoices || invoices.length === 0) return { error: 'No pending invoices selected' }

  const { data: userProfile } = await supabase
    .from('users')
    .select('style_preference')
    .eq('id', user.id)
    .single()

  const userStyle = (userProfile?.style_preference as string) || 'professional'
  const drafts: Array<Record<string, unknown>> = []
  const errors: string[] = []

  for (const invoice of invoices) {
    try {
      const client = invoice.client as Record<string, unknown> | null
      if (!client?.name) continue

      const dueDate = new Date(invoice.due_date)
      const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      const { generateFollowUpMessage } = await import('@/lib/ai/message-generator')
      const message = generateFollowUpMessage({
        clientName: client.name as string,
        invoiceNumber: invoice.invoice_number || invoice.id.slice(0, 8),
        amount: Number(invoice.amount),
        dueDate: dueDate.toLocaleDateString('en-IN'),
        daysOverdue,
        onTimeRate: Number(client.on_time_rate || 0),
        reminderCount: 0,
        userStyle: userStyle as 'casual' | 'professional' | 'formal',
      })

      drafts.push({
        user_id: user.id,
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        channel: 'whatsapp',
        template_type: 'payment_followup',
        message_text: message.text,
        language: 'en',
        status: 'draft',
        approval_status: 'draft',
      })
    } catch (e) {
      errors.push(`Invoice ${invoice.invoice_number}: ${e instanceof Error ? e.message : 'Unknown'}`)
    }
  }

  if (drafts.length > 0) {
    const { error } = await supabase.from('reminders').insert(drafts)
    if (error) return { error: error.message }
  }

  revalidatePath('/invoices')
  revalidatePath('/approvals')
  return { success: true, draftsCreated: drafts.length, errors: errors.length > 0 ? errors : undefined }
}
