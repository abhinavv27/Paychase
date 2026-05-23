import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-helpers'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('Unauthorized', 401)

  const [clients, invoices, reminders, payments] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', user.id),
    supabase.from('invoices').select('*').eq('user_id', user.id),
    supabase.from('reminders').select('*').eq('user_id', user.id),
    supabase.from('payments').select('*').eq('user_id', user.id),
  ])

  const exportData = {
    exportedAt: new Date().toISOString(),
    clients: clients.data || [],
    invoices: invoices.data || [],
    reminders: reminders.data || [],
    payments: payments.data || [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="paychase-export.json"',
    },
  })
}
