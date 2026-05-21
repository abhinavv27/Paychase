import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { id: whatsappMessageId, status: deliveryStatus, recipient_id } = status

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
    const { from, id: messageId, timestamp } = message

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
