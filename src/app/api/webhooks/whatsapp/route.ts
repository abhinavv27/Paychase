import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api-helpers'
import { createAdminClient, asDb } from '@/lib/supabase/admin'
import { parseCommand, getHelpText } from '@/lib/whatsapp/bot-commands'
import { findOrCreateUserByPhone, getOnboardingMessage, completeUserSetup } from '@/lib/whatsapp/user-linking'
import {
  handleStatusCommand,
  handleFollowupCommand,
  handleAddClientCommand,
  handleMarkPaidCommand,
} from '@/lib/whatsapp/bot-handlers'
import { rateLimit } from '@/lib/rate-limit'
import { sendTextMessage } from '@/lib/whatsapp/client'
import crypto from 'crypto'

interface WhatsAppStatus {
  id: string
  status: string
  errors?: Array<{ message?: string }>
}

interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
}

interface WhatsAppValue {
  statuses?: WhatsAppStatus[]
  messages?: WhatsAppMessage[]
}

interface WhatsAppChange {
  value: WhatsAppValue
}

interface WhatsAppEntry {
  changes?: WhatsAppChange[]
}

interface WhatsAppBody {
  entry?: WhatsAppEntry[]
}

async function handleBotCommand(from: string, text: string) {
  const supabase = createAdminClient()

  const rateLimitKey = `bot:${from}`
  const rateResult = await rateLimit(rateLimitKey, { maxRequests: 30, windowSeconds: 3600 })
  if (!rateResult.success) {
    await sendTextMessage(from, 'Too many requests. Please wait a moment and try again.')
    return
  }

  const { userId, needsSetup } = await findOrCreateUserByPhone(from)

  if (needsSetup) {
    const setupMatch = text.match(/^setup\s+(.+?)\s+(.+)$/i)
    if (setupMatch) {
      const [, name, email] = setupMatch
      const result = await completeUserSetup(userId, name.trim(), email.trim())
      if (result.success) {
        await sendTextMessage(from, `Setup complete! Welcome, ${name}!\n\n${getHelpText()}`)
      } else {
        await sendTextMessage(from, `Setup failed: ${result.error}. Please try again.`)
      }
      return
    }
    await sendTextMessage(from, getOnboardingMessage())
    return
  }

  const { data: user } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single()

  const typedUser = user as { plan: string | null } | null
  if (typedUser?.plan === 'paused' && text.toLowerCase() !== 'help' && text.toLowerCase() !== 'menu') {
    await sendTextMessage(from, 'Notifications are paused. Send HELP to resume.')
    return
  }

  const parsed = parseCommand(text)

  switch (parsed.command) {
    case 'help':
      await sendTextMessage(from, getHelpText())
      break

    case 'status': {
      const response = await handleStatusCommand(supabase, userId)
      await sendTextMessage(from, response)
      break
    }

    case 'followup': {
      await sendTextMessage(from, 'Sending follow-ups...')
      const response = await handleFollowupCommand(supabase, userId, null)
      await sendTextMessage(from, response)
      break
    }

    case 'followup_specific': {
      await sendTextMessage(from, `Sending follow-up to "${parsed.params.clientName}"...`)
      const response = await handleFollowupCommand(supabase, userId, parsed.params.clientName!)
      await sendTextMessage(from, response)
      break
    }

    case 'add_client': {
      const response = await handleAddClientCommand(supabase, userId, parsed.params)
      await sendTextMessage(from, response)
      break
    }

    case 'mark_paid': {
      const response = await handleMarkPaidCommand(supabase, userId, parsed.params.invoiceNumber!)
      await sendTextMessage(from, response)
      break
    }

    case 'stop': {
      await asDb(supabase).from('users').update({ plan: 'paused' }).eq('id', userId)
      await sendTextMessage(from, 'Notifications paused. Send HELP to resume.')
      break
    }

    case 'unknown':
      await sendTextMessage(from, `I didn't understand that. Send HELP for available commands.`)
      break
  }
}

async function handleClientReply(supabase: ReturnType<typeof createAdminClient>, messageId: string, timestamp: string) {
  const respondedAt = new Date(parseInt(timestamp) * 1000).toISOString()
  const db = asDb(supabase)

  const { data: reminder } = await db
    .from('reminders')
    .select('id, invoice_id')
    .eq('whatsapp_message_id', messageId)
    .single()

  const typedReminder = reminder as { id: string; invoice_id: string } | null
  if (!typedReminder) return

  await db
    .from('reminders')
    .update({ responded_at: respondedAt, status: 'responded' })
    .eq('id', typedReminder.id)

  const { data: invoice } = await db
    .from('invoices')
    .select('user_id, client_id')
    .eq('id', typedReminder.invoice_id)
    .single()

  const typedInvoice = invoice as { user_id: string; client_id: string } | null
  if (!typedInvoice) return

  const responseHour = new Date(respondedAt).getHours()
  if (responseHour >= 6 && responseHour <= 22) {
    await db
      .from('clients')
      .update({ optimal_send_hour: responseHour })
      .eq('id', typedInvoice.client_id)
      .eq('user_id', typedInvoice.user_id)
  }
}

function verifyWhatsAppSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false

  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) {
    console.error('WHATSAPP_APP_SECRET not configured')
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex')

  const signaturePrefix = 'sha256='
  if (!signature.startsWith(signaturePrefix)) return false

  const signatureHash = signature.slice(signaturePrefix.length)

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHash),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256')

  if (!verifyWhatsAppSignature(rawBody, signature)) {
    return apiError('Invalid signature', 401)
  }

  let body: WhatsAppBody
  try {
    body = JSON.parse(rawBody)
  } catch {
    return apiError('Invalid JSON', 400)
  }

  const entry = body.entry?.[0]
  if (!entry) {
    return NextResponse.json({ status: 'ignored' })
  }

  const change = entry.changes?.[0]
  if (!change) {
    return NextResponse.json({ status: 'ignored' })
  }

  const { value } = change
  const supabase = createAdminClient()
  const db = asDb(supabase)

  const statuses = value.statuses || []
  for (const status of statuses) {
    try {
      const { id: whatsappMessageId, status: deliveryStatus } = status
      if (!whatsappMessageId) continue

      const now = new Date().toISOString()
      const updates: Record<string, string> = {}

      switch (deliveryStatus) {
        case 'delivered':
          updates.delivered_at = now
          updates.status = 'delivered'
          break
        case 'read':
          updates.read_at = now
          updates.status = 'read'
          break
        case 'failed':
          updates.status = 'failed'
          updates.error_message = status.errors?.[0]?.message || 'Unknown error'
          break
      }

      if (Object.keys(updates).length > 0) {
        await db
          .from('reminders')
          .update(updates as Record<string, unknown>)
          .eq('whatsapp_message_id', whatsappMessageId)
      }
    } catch (err) {
      console.error('Failed to process status update:', err)
    }
  }

  const messages = value.messages || []
  for (const message of messages) {
    const { from, id: messageId, timestamp } = message

    if (message.type === 'text' && message.text?.body) {
      const text = message.text.body

      const cleanFrom = from.replace(/[^\d]/g, '')
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, name, email')
        .or(`phone.eq.${cleanFrom},phone.eq.91${cleanFrom.length === 10 ? cleanFrom : ''}`)
        .single()

      if (existingUser) {
        try {
          await handleBotCommand(from, text)
        } catch (err) {
          console.error('Failed to handle bot command:', err)
        }
      } else if (messageId && timestamp) {
        try {
          await handleClientReply(supabase, messageId, timestamp)
        } catch (err) {
          console.error('Failed to handle client reply:', err)
        }
      }
    }
  }

  return NextResponse.json({ status: 'ok' })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return apiError('Forbidden', 403)
}
