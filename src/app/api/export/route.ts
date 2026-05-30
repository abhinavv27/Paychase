import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-helpers'
import { withRateLimit } from '@/lib/rate-limit-middleware'

export async function GET(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'data-export', 10, 60)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Unauthorized', 401)

  const [clientsRes, invoicesRes, remindersRes, paymentsRes] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', user.id),
    supabase.from('invoices').select('*').eq('user_id', user.id),
    supabase.from('reminders').select('*').eq('user_id', user.id),
    supabase.from('payments').select('*').eq('user_id', user.id),
  ])

  for (const res of [clientsRes, invoicesRes, remindersRes, paymentsRes]) {
    if (res.error) {
      return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
    }
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    clients: clientsRes.data,
    invoices: invoicesRes.data,
    reminders: remindersRes.data,
    payments: paymentsRes.data,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="paychase-export.json"',
    },
  })
}
