import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage, buildReminderTemplate } from '@/lib/whatsapp'
import { getSentimentTone, renderReminderTemplate } from '@/lib/ai'

const BATCH_SIZE = 50

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]
  const { data: overdueInvoices, error } = await supabase
    .from('invoices')
    .select('*, client:clients(name, phone, email, on_time_rate, preferred_language, optimal_send_hour)')
    .eq('status', 'pending')
    .lt('due_date', today)
    .range(0, BATCH_SIZE - 1)

  if (error || !overdueInvoices) {
    return NextResponse.json({ status: 'ok', dispatched: 0 })
  }

  let dispatched = 0

  for (const invoice of overdueInvoices) {
    const client = invoice.client as {
      name: string
      phone: string | null
      email: string | null
      on_time_rate: number
      preferred_language: string
      optimal_send_hour: number
    } | null

    if (!client) continue

    if (invoice.last_reminder_sent) {
      const lastSent = new Date(invoice.last_reminder_sent)
      const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60)
      if (hoursSince < 48) continue
    }

    const daysOverdue = Math.floor(
      (new Date(today).getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
    )

    const tone = getSentimentTone(client.on_time_rate)
    const messageText = renderReminderTemplate({
      clientName: client.name,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.amount,
      dueDate: invoice.due_date,
      daysOverdue,
      tone,
      language: client.preferred_language,
      upiLink: invoice.upi_link || undefined,
    })

    if (client.phone) {
      try {
        const result = await sendWhatsAppMessage({
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
          to: client.phone,
          templateName: 'payment_reminder',
          language: client.preferred_language || 'en',
          components: buildReminderTemplate({
            clientName: client.name,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.amount,
            dueDate: invoice.due_date,
            daysOverdue,
            upiLink: invoice.upi_link || undefined,
          }),
          accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
        })

        await supabase
          .from('reminders')
          .insert({
            user_id: invoice.user_id,
            invoice_id: invoice.id,
            client_id: invoice.client_id,
            channel: 'whatsapp',
            template_type: 'payment_reminder',
            message_text: messageText,
            language: client.preferred_language || 'en',
            sent_at: new Date().toISOString(),
            status: 'sent',
            whatsapp_message_id: result.messages?.[0]?.id,
          })
      } catch (error) {
        console.error(`Failed to send WhatsApp to ${client.phone}:`, error)
        await supabase
          .from('reminders')
          .insert({
            user_id: invoice.user_id,
            invoice_id: invoice.id,
            client_id: invoice.client_id,
            channel: 'whatsapp',
            template_type: 'payment_reminder',
            message_text: messageText,
            language: client.preferred_language || 'en',
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
      }
    }

    await supabase
      .from('invoices')
      .update({
        reminder_count: (invoice.reminder_count || 0) + 1,
        last_reminder_sent: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    dispatched++
  }

  return NextResponse.json({
    status: 'ok',
    dispatched,
  })
}
