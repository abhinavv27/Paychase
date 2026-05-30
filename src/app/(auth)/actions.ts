'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'

async function getClientIp(): Promise<string> {
  const headersList = await headers()
  return headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function login(formData: FormData) {
  const ip = await getClientIp()
  const email = formData.get('email') as string

  const { success: allowed } = await rateLimit(
    `ratelimit:auth:login:${ip}:${email}`,
    { maxRequests: 5, windowSeconds: 60 }
  )
  if (!allowed) {
    redirect('/login?error=Too many attempts. Please try again later.')
  }

  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/')
}

export async function signup(formData: FormData) {
  const ip = await getClientIp()

  const { success: allowed } = await rateLimit(
    `ratelimit:auth:signup:${ip}`,
    { maxRequests: 3, windowSeconds: 3600 }
  )
  if (!allowed) {
    redirect('/signup?error=Too many signup attempts. Please try again later.')
  }

  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const style = (formData.get('style') as string) || 'professional'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        name,
      },
    },
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  if (data?.user) {
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        name,
        style_preference: style,
      })

    if (insertError) {
      console.error('Failed to create user profile:', insertError)
    }
  }

  redirect('/login?message=Check your email to confirm your account')
}

export async function forgotPassword(formData: FormData) {
  const ip = await getClientIp()
  const email = formData.get('email') as string

  const { success: allowed } = await rateLimit(
    `ratelimit:auth:forgot:${ip}:${email}`,
    { maxRequests: 3, windowSeconds: 3600 }
  )
  if (!allowed) {
    return { error: 'Too many requests. Please try again later.' }
  }

  const supabase = await createClient()
  const origin = (await headers()).get('origin')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const ip = await getClientIp()

  const { success: allowed } = await rateLimit(
    `ratelimit:auth:reset:${ip}`,
    { maxRequests: 5, windowSeconds: 3600 }
  )
  if (!allowed) {
    return { error: 'Too many attempts. Please try again later.' }
  }

  const supabase = await createClient()

  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/login?message=Password updated successfully')
}
