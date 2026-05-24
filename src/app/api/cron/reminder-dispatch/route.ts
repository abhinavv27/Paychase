import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, asDb } from '@/lib/supabase/admin'
import { requireCronAuth, apiError } from '@/lib/api-helpers'
import { generateFollowUpMessage } from '@/lib/ai/message-generator'
import type { Language } from '@/lib/ai/translations'
import { getOptimalSendTime } from '@/lib/ai/smart-timing'
import { sendEmail, paymentReminderEmail } from '@/lib/email'

const BATCH_SIZE = 100

export async function GET(request: NextRequest) {
  try {
    const authError = requireCronAuth(request)
    if (authError) return authError

    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    let offset = 0
    let totalDrafts = 0
    let totalSkipped = 0
    let hasMore = true

    while (hasMore) {
      const { data: overdueInvoices, error } = await supabase
        .from('invoices')
        .select('*, client:clients(name, phone, email, on_time_rate, risk_score, preferred_language)')
        .eq('status', 'pending')
        .lt('due_date', today)
        .range(offset, offset + BATCH_SIZE - 1)

      if (error || !overdueInvoices || overdueInvoices.length === 0) {
        hasMore = false
        continue
      }

      const typedInvoices = overdueInvoices as Array<{
        id: string
        user_id: string
        client_id: string
        amount: number
        due_date: string
        client: Record<string, unknown> | null
      }>

       const draftsToInsert: Array<{
         userId: string
         invoiceId: string
         clientId: string
         messageText: string
         daysOverdue: number
         scheduledSendAt: string | null
       }> = []

      for (const invoice of typedInvoices) {
        try {
          const userId = invoice.user_id
          const client = invoice.client as Record<string, unknown> | null

          if (!client?.name) continue

          // Check if draft already exists for this invoice (dedup)
          const { count: existingDrafts } = await supabase
            .from('reminders')
            .select('*', { count: 'exact', head: true })
            .eq('invoice_id', invoice.id)
            .eq('approval_status', 'draft')

          if (existingDrafts && existingDrafts > 0) {
            totalSkipped++
            continue
          }

          // Fetch user info for rate limiting
          const { data: user } = await supabase
            .from('users')
            .select('phone, email, plan, style_preference')
            .eq('id', userId)
            .single()

          const typedUser = user as { phone: string | null; email: string | null; plan: string | null; style_preference: string | null } | null
          if (!typedUser?.phone) {
            if (!typedUser?.email) {
              totalSkipped++
              continue
            }
            const dueDateEmail = new Date(invoice.due_date)
            const daysOverdueEmail = Math.floor((Date.now() - dueDateEmail.getTime()) / (1000 * 60 * 60 * 24))

            const amountStr = `₹${Number(invoice.amount).toLocaleString('en-IN')}`
            const escalationLevel = daysOverdueEmail <= 3 ? 'gentle' : daysOverdueEmail <= 14 ? 'firm' : 'urgent'

            const emailContent = paymentReminderEmail({
              clientName: client.name as string,
              invoiceNumber: invoice.id.slice(0, 8).toUpperCase(),
              amount: amountStr,
              dueDate: dueDateEmail.toLocaleDateString('en-IN'),
              daysOverdue: daysOverdueEmail,
              escalationLevel,
            })

            const { error: emailInsertError } = await asDb(supabase).from('reminders').insert({
              user_id: userId,
              invoice_id: invoice.id,
              client_id: invoice.client_id,
              channel: 'email',
              template_type: 'payment_followup',
              message_text: emailContent.html.slice(0, 500),
              language: 'en',
              status: 'draft',
              approval_status: 'draft',
            } as Record<string, unknown>)

            if (emailInsertError) {
              console.error('Failed to insert email draft:', emailInsertError)
              totalSkipped++
              continue
            }

            await sendEmail({
              to: typedUser.email,
              subject: emailContent.subject,
              html: emailContent.html,
            }).catch((e) => console.error('Failed to send email reminder:', e))

            totalDrafts++
            continue
          }
          if (typedUser.plan === 'paused') continue

           const userStyle = (typedUser?.style_preference as string) || 'professional'

           // Fetch client's past reminders for smart timing
           const { data: pastReminders } = await supabase
             .from('reminders')
             .select('sent_at, responded_at')
             .eq('client_id', invoice.client_id)
             .not('sent_at', 'is', null)
             .order('sent_at', { ascending: false })
             .limit(50)

           const typedPastReminders = (pastReminders || []) as Array<{
             sent_at: string | null
             responded_at: string | null
           }>

           const optimalHour = getOptimalSendTime(typedPastReminders)
           const tomorrow = new Date()
           tomorrow.setDate(tomorrow.getDate() + 1)
           tomorrow.setHours(optimalHour, 0, 0, 0)
           const scheduledSendAt = tomorrow.toISOString()

           // Check rate limit per user (max 1 draft batch per 4 hours)
          const { count: recentDrafts } = await supabase
            .from('reminders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('approval_status', 'draft')
            .gte('created_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())

          if (recentDrafts && recentDrafts > 3) continue

          const dueDate = new Date(invoice.due_date)
          const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

          const messageContext = {
            clientName: client.name as string,
            invoiceNumber: invoice.id.slice(0, 8).toUpperCase(),
            amount: Number(invoice.amount),
            dueDate: dueDate.toLocaleDateString('en-IN'),
            daysOverdue,
            onTimeRate: Number(client.on_time_rate || 0),
            reminderCount: 0,
            userStyle: userStyle as 'casual' | 'professional' | 'formal',
            language: (client.preferred_language as Language) || 'en',
          }

          const aiMessage = generateFollowUpMessage(messageContext)

           draftsToInsert.push({
             userId,
             invoiceId: invoice.id,
             clientId: invoice.client_id,
             messageText: aiMessage.text,
             daysOverdue,
             scheduledSendAt,
           })
        } catch (loopError) {
          console.error('Failed to process draft for invoice:', invoice.id, loopError)
        }
      }

      // Sort by urgency (most overdue first = earlier in the day ordering)
      draftsToInsert.sort((a, b) => b.daysOverdue - a.daysOverdue)

       for (const draft of draftsToInsert) {
         const { error: insertError } = await asDb(supabase).from('reminders').insert({
           user_id: draft.userId,
           invoice_id: draft.invoiceId,
           client_id: draft.clientId,
           channel: 'whatsapp',
           template_type: 'payment_followup',
           message_text: draft.messageText,
           language: 'en',
           status: 'draft',
           approval_status: 'draft',
           scheduled_send_at: draft.scheduledSendAt,
         } as Record<string, unknown>)

        if (insertError) {
          console.error('Failed to insert draft:', insertError)
          continue
        }

        totalDrafts++
      }

      offset += BATCH_SIZE
      if (typedInvoices.length < BATCH_SIZE) {
        hasMore = false
      }
    }

    return NextResponse.json({
      status: 'ok',
      draftsCreated: totalDrafts,
      skippedExisting: totalSkipped,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return apiError(message, 500)
  }
}
