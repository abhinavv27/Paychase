'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

export async function createClientAction(formData: FormData) {
  const supabase = createClient()

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const industry = formData.get('industry') as string
  const consent = formData.get('consent')

  if (!name?.trim()) {
    return { error: 'Name is required' }
  }

  if (!consent) {
    return { error: 'You must confirm client consent to proceed' }
  }

  const { data: user, error: userError } = await supabase.auth.getUser()
  if (userError || !user.user) {
    return { error: 'Not authenticated' }
  }

  const clientData: ClientInsert = {
    user_id: user.user.id,
    name: name.trim(),
    phone: phone.trim() || null,
    email: email.trim() || null,
    industry: industry || null,
    consent_given: true,
    consent_date: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('clients')
    .insert(clientData)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  await supabase.from('consent_log').insert({
    user_id: user.user.id,
    client_phone: phone.trim() || null,
    client_email: email.trim() || null,
    consent_type: 'payment_reminders',
    consent_given: true,
  })

  revalidatePath('/clients')
  redirect('/clients')
}

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = createClient()

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
  const industry = formData.get('industry') as string

  if (!name?.trim()) {
    return { error: 'Name is required' }
  }

  const clientData: ClientUpdate = {
    name: name.trim(),
    phone: phone.trim() || null,
    email: email.trim() || null,
    industry: industry || null,
  }

  const { error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')
  redirect('/clients')
}
