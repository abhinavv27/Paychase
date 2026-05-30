import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseCommand, getHelpText } from '@/lib/whatsapp/bot-commands'
import { findOrCreateUserByPhone, getOnboardingMessage, completeUserSetup } from '@/lib/whatsapp/user-linking'

async function sendTextMessage(to: string, text: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    console.error('WhatsApp credentials not configured')
    return
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    console.error('WhatsApp send error:', error)
  }
}

async function handleBotCommand(from: string, text: string) {
  const supabase = createClient()

  const { userId, isNew, needsSetup } = await findOrCreateUserByPhone(from)

  if (needsSetup) {
    const setupMatch = text.match(/^setup\s+(.+?)\s+(.+)$/i)
    if (setupMatch) {
      const [, name, email] = setupMatch
      const result = await completeUserSetup(userId, name.trim(), email.trim())
      if (result.success) {
        await sendTextMessage(from, `✅ Setup complete! Welcome, ${name}! Send HELP to get started.`)
      } else {
        await sendTextMessage(from, `❌ Setup failed: ${result.error}. Please try again.`)
      }
      return
    }
    await sendTextMessage(from, getOnboardingMessage())
    return
  }

  const parsed = parseCommand(text)

  switch (parsed.command) {
    case 'help':
      await sendTextMessage(from, getHelpText())
      break
    case 'status':
      await sendTextMessage(from, '📊 Status feature coming soon!')
      break
    case 'followup':
      await sendTextMessage(from, '📤 Follow-up feature coming soon!')
      break
    case 'followup_specific':
      await sendTextMessage(from, `📤 Follow-up for "${parsed.params.clientName}" coming soon!`)
      break
    case 'add_client':
      await sendTextMessage(from, '📝 Add client feature coming soon!')
      break
    case 'mark_paid':
      await sendTextMessage(from, `💰 Marking invoice "${parsed.params.invoiceNumber}" as paid coming soon!`)
      break
    case 'stop':
      await sendTextMessage(from, '🔕 Notifications paused. Send HELP to resume.')
      break
    case 'unknown':
      await sendTextMessage(from, `❓ Unknown command. Send HELP for available commands.\n\nYou said: "${text}"`)
      break
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const entry = body.entry?.[0]
  if (!entry) {
    return NextResponse.json({ status: 'ignored' })
  }

  const changes = entry.changes?.[0]
  if (!changes) {
    return NextResponse.json({ status: 'ignored' })
  }

  const { value } = changes
  const statuses = value.statuses || []

  const supabase = createClient()

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
        update = {
          status: 'failed',
          error_message: status.errors?.[0]?.message || 'Unknown error',
        }
        break
    }

    if (Object.keys(update).length > 0) {
      await supabase
        .from('reminders')
        .update(update)
        .eq('whatsapp_message_id', whatsappMessageId)
    }
  }

  const messages = value.messages || []
  for (const message of messages) {
    const { id: messageId, timestamp } = message

    if (message.type === 'text' && message.text?.body) {
      const from = message.from
      const text = message.text.body
      await handleBotCommand(from, text)
    }

    if (messageId && timestamp) {
      const respondedAt = new Date(parseInt(timestamp) * 1000).toISOString()

      await supabase
        .from('reminders')
        .update({ responded_at: respondedAt, status: 'responded' })
        .eq('whatsapp_message_id', messageId)
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

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
