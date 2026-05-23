'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type ClientInsert = Database['public']['Tables']['clients']['Insert']
type ClientUpdate = Database['public']['Tables']['clients']['Update']

export async function quickCreateClientAction(
  _prevState: { error?: string; id?: string; name?: string },
  formData: FormData
): Promise<{ error?: string; id?: string; name?: string }> {
  const supabase = createClient()

  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const email = formData.get('email') as string
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
    consent_given: true,
    consent_date: new Date().toISOString(),
  }

  const { data: newClient, error } = await supabase
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
  }).catch(console.error)

  revalidatePath('/invoices/create')
  return { id: (newClient as unknown as { id: string }).id, name: name.trim() }
}

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

  const { error } = await supabase
    .from('clients')
    .insert(clientData)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  const { error: consentError } = await supabase.from('consent_log').insert({
    user_id: user.user.id,
    client_phone: phone.trim() || null,
    client_email: email.trim() || null,
    consent_type: 'payment_reminders',
    consent_given: true,
  })

  if (consentError) {
    console.error('Failed to log consent:', consentError)
  }

  revalidatePath('/clients')
  redirect('/clients')
}

export async function deleteClientAction(clientId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error: aiError } = await supabase.from('ai_predictions').delete().eq('client_id', clientId).eq('user_id', user.id)
  if (aiError) return { error: aiError.message }

  const { error: reminderError } = await supabase.from('reminders').delete().eq('client_id', clientId).eq('user_id', user.id)
  if (reminderError) return { error: reminderError.message }

  const { error: paymentError } = await supabase.from('payments').delete().eq('client_id', clientId).eq('user_id', user.id)
  if (paymentError) return { error: paymentError.message }

  const { error: invoiceError } = await supabase.from('invoices').delete().eq('client_id', clientId).eq('user_id', user.id)
  if (invoiceError) return { error: invoiceError.message }

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { success: true }
}

export async function updateClientAction(id: string, formData: FormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

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
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')
  redirect('/clients')
}
