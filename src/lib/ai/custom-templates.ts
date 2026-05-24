'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CustomTemplate {
  id: string
  user_id: string
  name: string
  language: string
  escalation_level: 'gentle' | 'firm' | 'urgent'
  message_text: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getTemplates(): Promise<CustomTemplate[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('custom_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('language')
    .order('escalation_level')

  return data || []
}

export async function getTemplate(id: string): Promise<CustomTemplate | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('custom_templates')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  return data
}

export async function saveTemplate(params: {
  id?: string
  name: string
  language: string
  escalation_level: string
  message_text: string
  variables: string[]
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const payload = { ...params, updated_at: new Date().toISOString() }

  if (params.id) {
    const { error } = await supabase
      .from('custom_templates')
      .update(payload)
      .eq('id', params.id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('custom_templates')
      .insert({ ...payload, user_id: user.id })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/settings/templates')
}

export async function deleteTemplate(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('custom_templates').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/settings/templates')
}

export async function lookupTemplate(params: {
  language: string
  escalationLevel: string
  userId: string
}): Promise<CustomTemplate | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('custom_templates')
    .select('*')
    .eq('user_id', params.userId)
    .eq('language', params.language)
    .eq('escalation_level', params.escalationLevel)
    .eq('is_active', true)
    .maybeSingle()
  return data
}
