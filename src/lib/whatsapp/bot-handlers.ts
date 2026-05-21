import { generateFollowUpMessage } from '@/lib/ai'
import type { MessageContext } from '@/lib/ai'
import { sendWhatsAppMessage } from '@/lib/whatsapp/client'
import { formatPhoneForWhatsApp } from '@/lib/whatsapp/deep-link'

export async function handleStatusCommand(supabase: any, userId: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]

  const { data: overdueInvoices, error } = await supabase
    .from('invoices')
    .select('*, client:clients(name, phone, email, on_time_rate, risk_score)')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error || !overdueInvoices || overdueInvoices.length === 0) {
    return '✅ All caught up! No overdue invoices.'
  }

  const totalOutstanding = overdueInvoices.reduce((sum: number, inv: any) => sum + inv.amount, 0)

  let response = `📊 *Overdue Invoices*\n\n`
  response += `💰 Total outstanding: *₹${totalOutstanding.toLocaleString('en-IN')}*\n`
  response += `📋 ${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} overdue\n\n`

  for (const inv of overdueInvoices.slice(0, 5)) {
    const client = inv.client
    const daysOverdue = Math.floor(
      (new Date(today).getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24)
    )
    const riskEmoji = (client?.risk_score || 0.5) > 0.7 ? '🔴' : (client?.risk_score || 0.5) > 0.3 ? '🟡' : '🟢'

    response += `${riskEmoji} *${client?.name}* — ₹${inv.amount.toLocaleString('en-IN')}\n`
    response += `   Invoice: ${inv.invoice_number} · ${daysOverdue} days overdue\n`
    response += `   On-time rate: ${((client?.on_time_rate || 0.5) * 100).toFixed(0)}%\n\n`
  }

  if (overdueInvoices.length > 5) {
    response += `...and ${overdueInvoices.length - 5} more\n\n`
  }

  response += `Send *FOLLOWUP* to send reminders to all, or *FOLLOWUP [name]* for a specific client.`

  return response
}

export async function handleFollowupCommand(
  supabase: any,
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
      : '✅ No overdue invoices to follow up on.'
  }

  let sent = 0
  let failed = 0

  for (const invoice of overdueInvoices) {
    const client = invoice.client
    if (!client?.phone) {
      failed++
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

    const { error: reminderError } = await supabase
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
      })

    if (reminderError) {
      failed++
      continue
    }

    try {
      const phone = formatPhoneForWhatsApp(client.phone)
      await sendWhatsAppMessage({
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
        to: phone,
        templateName: 'payment_reminder',
        language: 'en',
        components: [{
          type: 'body',
          parameters: [{ type: 'text', text: message.text }],
        }],
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      })
      sent++

      await supabase
        .from('invoices')
        .update({
          reminder_count: (invoice.reminder_count || 0) + 1,
          last_reminder_sent: new Date().toISOString(),
        })
        .eq('id', invoice.id)
    } catch (error) {
      console.error(`Failed to send to ${client.name}:`, error)
      failed++
    }
  }

  let response = `✅ *Follow-ups sent!*\n\n`
  response += `📤 Sent: ${sent}\n`
  if (failed > 0) {
    response += `❌ Failed: ${failed} (no phone number or API error)\n`
  }
  response += `\nI'll notify you when clients respond.`

  return response
}

export async function handleAddClientCommand(
  supabase: any,
  userId: string,
  params: { clientName?: string; phone?: string; amount?: number; dueDate?: string }
): Promise<string> {
  const { clientName, phone, amount, dueDate } = params

  if (!clientName) {
    return `❌ Please provide a client name.\n\n*Format:* ADD CLIENT [name] [phone] [amount] [due date]\n*Example:* ADD CLIENT Acme Corp 9876543210 50000 2026-06-15`
  }

  const { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', clientName)
    .single()

  let clientId: string

  if (existingClient) {
    clientId = existingClient.id
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        name: clientName,
        phone: phone || null,
      })
      .select('id')
      .single()

    if (clientError) {
      return `❌ Failed to add client: ${clientError.message}`
    }
    clientId = newClient.id
  }

  if (amount && dueDate) {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
    const { error: invoiceError } = await supabase
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
      })

    if (invoiceError) {
      return `❌ Failed to create invoice: ${invoiceError.message}`
    }

    return `✅ Added *${clientName}* with invoice *${invoiceNumber}* for ₹${amount.toLocaleString('en-IN')} (due ${dueDate}).`
  }

  return `✅ Added *${clientName}${phone ? ` (${phone})` : ''}.\n\nSend ADD CLIENT [name] [phone] [amount] [due date] to create an invoice.`
}

export async function handleMarkPaidCommand(
  supabase: any,
  userId: string,
  invoiceNumber: string
): Promise<string> {
  if (!invoiceNumber) {
    return `❌ Please provide an invoice number.\n\n*Format:* PAID [invoice number]\n*Example:* PAID INV-001`
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, client:clients(name)')
    .eq('user_id', userId)
    .eq('invoice_number', invoiceNumber)
    .single()

  if (error || !invoice) {
    return `❌ Invoice *${invoiceNumber}* not found.`
  }

  if (invoice.status === 'paid') {
    return `ℹ️ Invoice *${invoiceNumber}* is already marked as paid.`
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_amount: invoice.amount,
      payment_date: new Date().toISOString(),
    })
    .eq('id', invoice.id)

  if (updateError) {
    return `❌ Failed to mark as paid: ${updateError.message}`
  }

  await supabase
    .from('payments')
    .insert({
      user_id: userId,
      invoice_id: invoice.id,
      client_id: invoice.client_id,
      amount: invoice.amount,
      currency: invoice.currency,
      method: 'manual',
      status: 'captured',
    })

  return `✅ Marked *${invoiceNumber}* (₹${invoice.amount.toLocaleString('en-IN')}) as paid. Great work! 🎉`
}
