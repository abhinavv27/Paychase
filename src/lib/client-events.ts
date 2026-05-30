'use server'

import { createClient } from '@/lib/supabase/server'

export type EventType = 'invoice_sent' | 'invoice_paid' | 'reminder_sent' | 'reminder_delivered' | 'reminder_responded' | 'note_added'

export interface ClientEvent {
  id: string
  client_id: string
  user_id: string
  event_type: EventType
  event_data: Record<string, unknown>
  created_at: string
}

export async function insertClientEvent(params: {
  clientId: string
  userId: string
  eventType: EventType
  eventData?: Record<string, unknown>
}) {
  const supabase = createClient()
  const { error } = await supabase.from('client_events').insert({
    client_id: params.clientId,
    user_id: params.userId,
    event_type: params.eventType,
    event_data: params.eventData || {},
  })
  if (error) throw new Error(`Failed to insert client event: ${error.message}`)
}

export async function getClientEvents(clientId: string): Promise<ClientEvent[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('client_events')
    .select('*')
    .eq('client_id', clientId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(`Failed to fetch client events: ${error.message}`)
  return data || []
}
