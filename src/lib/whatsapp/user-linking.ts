import { createClient } from '@/lib/supabase/server'

export async function findOrCreateUserByPhone(phone: string): Promise<{
  userId: string
  isNew: boolean
  needsSetup: boolean
}> {
  const supabase = createClient()
  const cleanPhone = phone.replace(/[^\d]/g, '')

  const { data: existingUser } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('phone', cleanPhone)
    .single()

  if (existingUser) {
    return { userId: existingUser.id, isNew: false, needsSetup: false }
  }

  const indiaPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
  const { data: existingUserIndia } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('phone', indiaPhone)
    .single()

  if (existingUserIndia) {
    return { userId: existingUserIndia.id, isNew: false, needsSetup: false }
  }

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      phone: indiaPhone,
      name: '',
      email: '',
      plan: 'free',
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`)
  }

  return { userId: newUser.id, isNew: true, needsSetup: true }
}

export async function completeUserSetup(
  userId: string,
  name: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('users')
    .update({ name, email })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function linkExistingUserPhone(
  userId: string,
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const cleanPhone = phone.replace(/[^\d]/g, '')
  const indiaPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('phone', indiaPhone)
    .neq('id', userId)
    .single()

  if (existingUser) {
    return { success: false, error: 'This phone number is already linked to another account' }
  }

  const { error } = await supabase
    .from('users')
    .update({ phone: indiaPhone })
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export function getOnboardingMessage(): string {
  return `👋 *Welcome to PayChase AI!*

I'm your payment collection assistant. Let's get you set up.

Please reply with your *name* and *email* in this format:
SETUP [your name] [your email]

*Example:* SETUP John Doe john@example.com

Once set up, you can:
• Send *WHO OWES* to see overdue payments
• Send *FOLLOWUP* to send reminders
• Send *ADD CLIENT* to add new invoices
• Send *HELP* for all commands`
}
