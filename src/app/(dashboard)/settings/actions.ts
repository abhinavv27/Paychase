'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { linkExistingUserPhone } from '@/lib/whatsapp/user-linking'
import { revalidatePath } from 'next/cache'

export async function updateProfileAction(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const name = formData.get('name') as string
  const company_name = formData.get('company_name') as string

  if (!name) return { error: 'Name is required' }

  const { error } = await supabase
    .from('users')
    .update({ name, company_name: company_name || null })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function deleteAccountAction() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const { error: authError } = await admin.auth.admin.deleteUser(user.id)
  if (authError) return { error: authError.message }

  const tables = ['audit_log', 'consent_log', 'ai_predictions', 'payments', 'reminders', 'invoices', 'clients', 'users']
  for (const table of tables) {
    await supabase.from(table).delete().eq('id', user.id)
  }

  revalidatePath('/')
  redirect('/login?message=Account deleted successfully')
}

export async function updateStyleAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const style = formData.get('style') as string
  if (!['casual', 'professional', 'formal'].includes(style)) {
    redirect('/settings?error=Invalid+style')
  }

  const { error } = await supabase
    .from('users')
    .update({ style_preference: style })
    .eq('id', user.id)

  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/settings')
  redirect('/settings')
}

export async function handleLinkPhone(_prev: unknown, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const phone = formData.get('phone') as string

  if (!phone) {
    return { error: 'Phone number is required' }
  }

  const result = await linkExistingUserPhone(user.id, phone)

  if (result.success) {
    revalidatePath('/settings')
    return { success: true }
  }

  return { error: result.error || 'Failed to link phone number' }
}
