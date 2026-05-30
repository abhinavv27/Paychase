import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']
type ClientRow = Database['public']['Tables']['clients']['Row']

export async function getClients(): Promise<ClientRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getClient(id: string): Promise<ClientRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createClientRecord(client: ClientInsert): Promise<ClientRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .insert(client)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateClient(id: string, client: ClientUpdate): Promise<ClientRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .update(client)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function logConsent(params: {
  client_phone?: string
  client_email?: string
  consent_type: string
  consent_given: boolean
  ip_address?: string
  user_agent?: string
}): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('consent_log')
    .insert({
      client_phone: params.client_phone,
      client_email: params.client_email,
      consent_type: params.consent_type,
      consent_given: params.consent_given,
      ip_address: params.ip_address,
      user_agent: params.user_agent,
    })
  if (error) throw error
}
