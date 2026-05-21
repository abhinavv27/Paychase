import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFollowUpMessage } from '@/lib/ai'
import type { MessageContext } from '@/lib/ai'

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
    .select('*, client:clients(name, phone, email, on_time_rate, preferred_language)')
    .eq('status', 'pending')
    .lt('due_date', today)
    .range(0, BATCH_SIZE - 1)

  if (error || !overdueInvoices) {
    return NextResponse.json({ status: 'ok', drafted: 0 })
  }

  let drafted = 0
  const usersWithDrafts = new Set<string>()

  for (const invoice of overdueInvoices) {
    const client = invoice.client as { name: string; phone: string | null; email: string | null; on_time_rate: number; preferred_language: string } | null

    if (!client || !client.phone) continue

    if (invoice.last_reminder_sent) {
      const lastSent = new Date(invoice.last_reminder_sent)
      const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60)
      if (hoursSince < 48) continue
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
      onTimeRate: client.on_time_rate,
      reminderCount: invoice.reminder_count || 0,
      upiLink: invoice.upi_link || undefined,
    }

    const message = generateFollowUpMessage(context)

    const { data: reminder, error: reminderError } = await supabase
      .from('reminders')
      .insert({
        user_id: invoice.user_id,
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        channel: 'whatsapp',
        template_type: message.escalationLevel,
        message_text: message.text,
        language: client.preferred_language || 'en',
        status: 'scheduled',
        approval_status: 'draft',
      })
      .select()
      .single()

    if (reminderError) {
      console.error(`Failed to create draft for invoice ${invoice.id}:`, reminderError)
      continue
    }

    usersWithDrafts.add(invoice.user_id)
    drafted++

    await supabase
      .from('invoices')
      .update({
        reminder_count: (invoice.reminder_count || 0) + 1,
        last_reminder_sent: new Date().toISOString(),
      })
      .eq('id', invoice.id)
  }

  for (const userId of Array.from(usersWithDrafts)) {
    const { data: user } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (user?.email) {
      const { count } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('approval_status', 'draft')

      console.log(`Email notification to ${user.email}: ${count} drafts ready for review`)
    }
  }

  return NextResponse.json({
    status: 'ok',
    drafted,
    usersNotified: usersWithDrafts.size,
  })
}
