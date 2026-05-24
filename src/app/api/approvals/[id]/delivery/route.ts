import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await request.json()
  if (!['sent', 'delivered', 'responded'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const dateField: Record<string, string> = {
    sent: 'sent_at',
    delivered: 'delivered_at',
    responded: 'responded_at',
  }

  const { error } = await supabase
    .from('reminders')
    .update({
      status,
      [dateField[status]]: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
