import { createAdminClient, asDb } from '@/lib/supabase/admin'

export async function findOrCreateUserByPhone(phone: string): Promise<{
  userId: string
  isNew: boolean
  needsSetup: boolean
}> {
  const supabase = createAdminClient()
  const db = asDb(supabase)
  const cleanPhone = phone.replace(/[^\d]/g, '')

  const { data: existingUser, error: findError } = await db
    .from('users')
    .select('id, name, email')
    .eq('phone', cleanPhone)
    .single()

  if (findError) {
    console.error('Error finding user by phone:', findError)
    throw new Error(`Database error: ${findError.message}`)
  }

  const typedUser = existingUser as { id: string } | null
  if (typedUser) {
    return { userId: typedUser.id, isNew: false, needsSetup: false }
  }

  const indiaPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
  const { data: existingUserIndia, error: findIndiaError } = await db
    .from('users')
    .select('id, name, email')
    .eq('phone', indiaPhone)
    .single()

  if (findIndiaError) {
    console.error('Error finding user by India phone:', findIndiaError)
    throw new Error(`Database error: ${findIndiaError.message}`)
  }

  const typedIndiaUser = existingUserIndia as { id: string } | null
  if (typedIndiaUser) {
    return { userId: typedIndiaUser.id, isNew: false, needsSetup: false }
  }

  const placeholderEmail = `pending_${Date.now()}@paychase.ai`
  const placeholderName = `User_${cleanPhone.slice(-4)}`

  const { data: newUser, error } = await db
    .from('users')
    .insert({
      phone: indiaPhone,
      name: placeholderName,
      email: placeholderEmail,
      plan: 'free',
    } as Record<string, unknown>)
    .select('id')
    .single()

  if (error || !newUser) {
    console.error('Failed to create user:', error)
    throw new Error(`Failed to create user: ${error?.message || 'No data returned'}`)
  }

  const userId = (newUser as { id: string }).id
  return { userId, isNew: true, needsSetup: true }
}

export async function completeUserSetup(
  userId: string,
  name: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()
  const db = asDb(supabase)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Invalid email format' }
  }

  if (!name || name.trim().length < 2) {
    return { success: false, error: 'Name must be at least 2 characters' }
  }

  const { data: existingEmail, error: emailError } = await db
    .from('users')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .neq('id', userId)
    .single()

  if (emailError) {
    console.error('Error checking existing email:', emailError)
    return { success: false, error: 'Failed to verify email availability' }
  }

  if (existingEmail) {
    return { success: false, error: 'Email already in use by another account' }
  }

  const { error } = await db
    .from('users')
    .update({ name: name.trim(), email: email.trim().toLowerCase() } as Record<string, unknown>)
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
  const supabase = createAdminClient()
  const db = asDb(supabase)
  const cleanPhone = phone.replace(/[^\d]/g, '')
  const indiaPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

  const { data: existingUser, error: linkError } = await db
    .from('users')
    .select('id')
    .eq('phone', indiaPhone)
    .neq('id', userId)
    .single()

  if (linkError) {
    console.error('Error checking existing phone:', linkError)
    return { success: false, error: 'Failed to verify phone availability' }
  }

  if (existingUser) {
    return { success: false, error: 'This phone number is already linked to another account' }
  }

  const { error } = await db
    .from('users')
    .update({ phone: indiaPhone } as Record<string, unknown>)
    .eq('id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export function getOnboardingMessage(): string {
  return `Welcome to PayChase AI!

I'm your payment collection assistant. Let's get you set up.

Please reply with your name and email in this format:
SETUP [your name] [your email]

Example: SETUP John Doe john@example.com

Once set up, you can:
- Send WHO OWES to see overdue payments
- Send FOLLOWUP to send reminders
- Send ADD CLIENT to add new invoices
- Send HELP for all commands`
}
