import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, string> = {}

  // Check Supabase
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('users').select('id').limit(1)
    checks.supabase = error ? 'error' : 'ok'
  } catch {
    checks.supabase = 'error'
  }

  // Check env vars
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'WHATSAPP_ACCESS_TOKEN',
    'RAZORPAY_WEBHOOK_SECRET',
  ]
  for (const key of required) {
    if (!process.env[key]) {
      checks[`env_${key}`] = 'missing'
    }
  }

  const allOk = Object.values(checks).every(v => v === 'ok')
  return NextResponse.json(
    { status: allOk ? 'ok' : 'degraded', checks },
    { status: allOk ? 200 : 503 }
  )
}
