import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, phone, email } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      consent_given: true,
      consent_date: new Date().toISOString(),
    })
    .select('id, name')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('consent_log').insert({
    user_id: user.id,
    client_name: name.trim(),
    client_phone: phone?.trim() || null,
    client_email: email?.trim() || null,
    consent_type: 'whatsapp',
    consent_given: true,
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  })

  return NextResponse.json({ client, success: true })
}
