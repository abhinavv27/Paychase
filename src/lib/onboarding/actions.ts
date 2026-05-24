'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function completeOnboarding(_prevState: { error?: string }, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const companyName = formData.get('company') as string
  const style = formData.get('style') as string

  if (!['casual', 'professional', 'formal'].includes(style)) {
    return { error: 'Invalid communication style' }
  }

  const { error } = await supabase
    .from('users')
    .update({
      company_name: companyName || null,
      style_preference: style || 'professional',
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  redirect('/')
}

export async function skipOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('users')
    .update({ company_name: '', style_preference: 'professional' })
    .eq('id', user.id)

  revalidatePath('/')
  redirect('/')
}
