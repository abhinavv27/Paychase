import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseCommand, getHelpText } from '@/lib/whatsapp/bot-commands'
import { sendWhatsAppMessage } from '@/lib/whatsapp/client'
import { handleStatusCommand } from '@/lib/whatsapp/bot-handlers'
import { handleFollowupCommand } from '@/lib/whatsapp/bot-handlers'
import { handleAddClientCommand } from '@/lib/whatsapp/bot-handlers'
import { handleMarkPaidCommand } from '@/lib/whatsapp/bot-handlers'

export async function POST(request: NextRequest) {
  const body = await request.json()

  const entry = body.entry?.[0]
  if (!entry) return NextResponse.json({ status: 'ignored' })

  const changes = entry.changes?.[0]
  if (!changes) return NextResponse.json({ status: 'ignored' })

  const { value } = changes
  const supabase = createClient()

  // Handle status updates (delivered, read, failed)
  const statuses = value.statuses || []
  for (const status of statuses) {
    const { id: whatsappMessageId, status: deliveryStatus } = status
    if (!whatsappMessageId) continue

    const now = new Date().toISOString()
    let update: Record<string, string> = {}

    switch (deliveryStatus) {
      case 'delivered':
        update = { delivered_at: now, status: 'delivered' }
        break
      case 'read':
        update = { read_at: now, status: 'read' }
        break
      case 'failed':
        update = { status: 'failed', error_message: status.errors?.[0]?.message || 'Unknown error' }
        break
    }

    if (Object.keys(update).length > 0) {
      await supabase.from('reminders').update(update).eq('whatsapp_message_id', whatsappMessageId)
    }
  }

  // Handle incoming messages
  const messages = value.messages || []
  for (const message of messages) {
    const { from, id: messageId, timestamp } = message
    if (!messageId || !timestamp || message.type !== 'text') continue

    const text = message.text?.body
    if (!text) continue

    // Check if sender is a registered user
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('phone', from)
      .single()

    if (user) {
      // This is a bot command from a registered user
      await handleBotCommand(supabase, user, text, from)
    } else {
      // This is a client reply — track it
      const respondedAt = new Date(parseInt(timestamp) * 1000).toISOString()
      await supabase
        .from('reminders')
        .update({ responded_at: respondedAt, status: 'responded' })
        .eq('whatsapp_message_id', messageId)
    }
  }

  return NextResponse.json({ status: 'ok' })
}

async function handleBotCommand(supabase: any, user: any, text: string, from: string) {
  const parsed = parseCommand(text)

  switch (parsed.command) {
    case 'help':
      await replyToUser(supabase, from, getHelpText())
      break

    case 'status':
      const statusResponse = await handleStatusCommand(supabase, user.id)
      await replyToUser(supabase, from, statusResponse)
      break

    case 'followup':
      const followupResponse = await handleFollowupCommand(supabase, user.id, null)
      await replyToUser(supabase, from, followupResponse)
      break

    case 'followup_specific':
      const specificResponse = await handleFollowupCommand(supabase, user.id, parsed.params.clientName!)
      await replyToUser(supabase, from, specificResponse)
      break

    case 'add_client':
      const addResponse = await handleAddClientCommand(supabase, user.id, parsed.params)
      await replyToUser(supabase, from, addResponse)
      break

    case 'mark_paid':
      const paidResponse = await handleMarkPaidCommand(supabase, user.id, parsed.params.invoiceNumber!)
      await replyToUser(supabase, from, paidResponse)
      break

    case 'stop':
      await supabase.from('users').update({ plan: 'paused' }).eq('id', user.id)
      await replyToUser(supabase, from, '⏸️ Notifications paused. Send HELP to resume.')
      break

    case 'unknown':
      await replyToUser(supabase, from, `I didn't understand that. Send HELP for available commands.`)
      break
  }
}

async function replyToUser(supabase: any, to: string, message: string) {
  try {
    await sendWhatsAppMessage({
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      to,
      templateName: 'paychase_response',
      language: 'en',
      components: [{
        type: 'body',
        parameters: [{ type: 'text', text: message }],
      }],
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    })
  } catch (error) {
    console.error('Failed to reply to user:', error)
  }
}

// WhatsApp webhook verification (GET request)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
