import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api-helpers'
import { withRateLimit } from '@/lib/rate-limit-middleware'

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'sign-out', 10, 60)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      return apiError(error.message, 500)
    }
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
  } catch {
    return apiError('Sign out failed', 500)
  }
}
