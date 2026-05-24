import { generateFollowUpMessage } from '@/lib/ai'
import type { MessageContext } from '@/lib/ai'
import { formatPhoneForWhatsApp } from '@/lib/whatsapp/deep-link'
import { createAdminClient, asDb } from '@/lib/supabase/admin'
import { sendTextMessage } from '@/lib/whatsapp/client'

interface InvoiceWithClient {
  id: string
  user_id: string
  client_id: string
  invoice_number: string
  amount: number
  currency: string
  issue_date: string
  due_date: string
  status: string
  paid_amount: number | null
  payment_date: string | null
  payment_method: string | null
  upi_link: string | null
  reminder_count: number | null
  last_reminder_sent: string | null
  created_at: string
  updated_at: string
  client: {
    name: string
    phone: string | null
    email: string | null
    on_time_rate: number | null
    risk_score: number | null
  } | null
}

export async function handleStatusCommand(supabase: ReturnType<typeof createAdminClient>, userId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]

  const { data: overdueInvoices, error } = await supabase
    .from('invoices')
    .select('*, client:clients(name, phone, email, on_time_rate, risk_score)')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error || !overdueInvoices || overdueInvoices.length === 0) {
    return 'All caught up! No overdue invoices.'
  }

  const typedInvoices = overdueInvoices as InvoiceWithClient[]
  const totalOutstanding = typedInvoices.reduce((sum: number, inv) => sum + inv.amount, 0)

  let response = `Overdue Invoices\n\n`
  response += `Total outstanding: Rs.${totalOutstanding.toLocaleString('en-IN')}\n`
  response += `${typedInvoices.length} invoice${typedInvoices.length > 1 ? 's' : ''} overdue\n\n`

  for (const inv of typedInvoices.slice(0, 5)) {
    const client = inv.client
    const daysOverdue = Math.floor(
      (new Date(today).getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    const riskScore = client?.risk_score || 0.5
    const riskEmoji = riskScore > 0.7 ? 'HIGH' : riskScore > 0.3 ? 'MED' : 'LOW'

    response += `[${riskEmoji}] ${client?.name} - Rs.${inv.amount.toLocaleString('en-IN')}\n`
    response += `   Invoice: ${inv.invoice_number} - ${daysOverdue} days overdue\n`
    response += `   On-time rate: ${((client?.on_time_rate || 0.5) * 100).toFixed(0)}%\n\n`
  }

  if (typedInvoices.length > 5) {
    response += `...and ${typedInvoices.length - 5} more\n\n`
  }

  response += `Reply FOLLOWUP to send reminders to all, or FOLLOWUP [name] for a specific client.`

  return response
}

export async function handleFollowupCommand(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  clientName: string | null
): Promise<string> {
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('invoices')
    .select('*, client:clients(name, phone, email, on_time_rate, risk_score)')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('due_date', today)

  if (clientName) {
    query = query.ilike('client.name', `%${clientName}%`)
  }

  const { data: overdueInvoices, error } = await query.order('due_date', { ascending: true })

  if (error || !overdueInvoices || overdueInvoices.length === 0) {
    return clientName
      ? `No overdue invoices found for "${clientName}".`
      : 'No overdue invoices to follow up on.'
  }

  const typedInvoices = overdueInvoices as InvoiceWithClient[]

  let sent = 0
  let failed = 0
  const failedNames: string[] = []

  const db = asDb(supabase)

  for (const invoice of typedInvoices) {
    const client = invoice.client
    if (!client?.phone) {
      failed++
      failedNames.push(client?.name || 'Unknown')
      continue
    }

    const daysOverdue = Math.floor(
      (new Date(today).getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
    )

    const context: MessageContext = {
      clientName: client.name,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.amount,
      dueDate: invoice.due_date,
      daysOverdue,
      onTimeRate: client.on_time_rate || 0.5,
      reminderCount: invoice.reminder_count || 0,
      upiLink: invoice.upi_link || undefined,
    }

    const message = generateFollowUpMessage(context)

    try {
      const phone = formatPhoneForWhatsApp(client.phone)
      const result = await sendTextMessage(phone, message.text)

      const whatsappMessageId = result?.messages?.[0]?.id

      const { error: reminderError } = await db
        .from('reminders')
        .insert({
          user_id: userId,
          invoice_id: invoice.id,
          client_id: invoice.client_id,
          channel: 'whatsapp',
          template_type: message.escalationLevel,
          message_text: message.text,
          language: 'en',
          status: 'sent',
          approval_status: 'sent',
          sent_at: new Date().toISOString(),
          sent_method: 'bot_command',
          whatsapp_message_id: whatsappMessageId,
        } as Record<string, unknown>)

      if (reminderError) {
        console.error(`Failed to log reminder for ${client.name}:`, reminderError)
      }

      const { error: updateError } = await db
        .from('invoices')
        .update({
          reminder_count: (invoice.reminder_count || 0) + 1,
          last_reminder_sent: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('id', invoice.id)

      if (updateError) {
        console.error(`Failed to update reminder count for invoice ${invoice.id}:`, updateError)
      }

      sent++
    } catch (error) {
      console.error(`Failed to send to ${client.name}:`, error)
      failed++
      failedNames.push(client.name)

      await db
        .from('reminders')
        .insert({
          user_id: userId,
          invoice_id: invoice.id,
          client_id: invoice.client_id,
          channel: 'whatsapp',
          template_type: message.escalationLevel,
          message_text: message.text,
          language: 'en',
          status: 'failed',
          approval_status: 'rejected',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        } as Record<string, unknown>)
    }
  }

  let response = `Follow-ups sent!\n\n`
  response += `Sent: ${sent}\n`
  if (failed > 0) {
    response += `Failed: ${failed} (${failedNames.join(', ')})\n`
  }
  response += `\nI'll notify you when clients respond.`

  return response
}

export async function handleAddClientCommand(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  params: { clientName?: string; phone?: string; amount?: number; dueDate?: string }
): Promise<string> {
  const { clientName, phone, amount, dueDate } = params

  if (!clientName) {
    return `Please provide a client name.\n\nFormat: ADD CLIENT [name] [phone] [amount] [due date]\nExample: ADD CLIENT Acme Corp 9876543210 50000 2026-06-15`
  }

  const db = asDb(supabase)

  const { data: existingClient } = await db
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .ilike!('name', clientName)
    .single()

  const typedExistingClient = existingClient as { id: string } | null
  let clientId: string

  if (typedExistingClient) {
    clientId = typedExistingClient.id
  } else {
    const { data: newClient, error: clientError } = await db
      .from('clients')
      .insert({
        user_id: userId,
        name: clientName,
        phone: phone || null,
      } as Record<string, unknown>)
      .select!('id')
      .single()

    if (clientError) {
      return `Failed to add client: ${clientError.message}`
    }
    clientId = (newClient as { id: string }).id
  }

  if (amount && dueDate) {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
    const { error: invoiceError } = await asDb(supabase)
      .from('invoices')
      .insert({
        user_id: userId,
        client_id: clientId,
        invoice_number: invoiceNumber,
        amount,
        currency: 'INR',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate,
        status: 'pending',
      } as Record<string, unknown>)

    if (invoiceError) {
      return `Failed to create invoice: ${(invoiceError as { message: string }).message}`
    }

    return `Added *${clientName}* with invoice *${invoiceNumber}* for Rs.${amount.toLocaleString('en-IN')} (due ${dueDate}).`
  }

  return `Added *${clientName}${phone ? ` (${phone})` : ''}.\n\nSend ADD CLIENT [name] [phone] [amount] [due date] to create an invoice.`
}

export async function handleMarkPaidCommand(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  invoiceNumber: string
): Promise<string> {
  if (!invoiceNumber) {
    return `Please provide an invoice number.\n\nFormat: PAID [invoice number]\nExample: PAID INV-001`
  }

  const db = asDb(supabase)

  const { data: invoice, error } = await db
    .from('invoices')
    .select('*, client:clients(name)')
    .eq('user_id', userId)
    .eq('invoice_number', invoiceNumber)
    .single()

  const typedInvoice = invoice as {
    id: string
    status: string
    amount: number
    currency: string
    client_id: string
    client: { name: string } | null
  } | null

  if (error || !typedInvoice) {
    return `Invoice *${invoiceNumber}* not found.`
  }

  if (typedInvoice.status === 'paid') {
    return `Invoice *${invoiceNumber}* is already marked as paid.`
  }

  const { error: updateError } = await db
    .from('invoices')
    .update({
      status: 'paid',
      paid_amount: typedInvoice.amount,
      payment_date: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('id', typedInvoice.id)

  if (updateError) {
    return `Failed to mark as paid: ${(updateError as { message: string }).message}`
  }

  const { error: paymentError } = await db
    .from('payments')
    .insert({
      user_id: userId,
      invoice_id: typedInvoice.id,
      client_id: typedInvoice.client_id,
      amount: typedInvoice.amount,
      currency: typedInvoice.currency,
      method: 'manual',
      status: 'captured',
    } as Record<string, unknown>)

  if (paymentError) {
    console.error('Failed to record payment:', paymentError)
  }

  return `Marked *${invoiceNumber}* (Rs.${typedInvoice.amount.toLocaleString('en-IN')}) as paid. Great work!`
}
