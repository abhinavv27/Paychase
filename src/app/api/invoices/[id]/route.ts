import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-helpers'
import { withRateLimit } from '@/lib/rate-limit-middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = await withRateLimit(request, 'invoices-read', 60, 60)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(name, phone, email)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return apiError(error.message, 404)
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = await withRateLimit(request, 'invoices-write', 30, 60)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const body = await request.json()
  const { error } = await supabase
    .from('invoices')
    .update(body)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return apiError(error.message, 400)
  }

  return NextResponse.json({ status: 'ok' })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = await withRateLimit(request, 'invoices-write', 30, 60)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return apiError(error.message, 400)
  }

  return NextResponse.json({ status: 'ok' })
}
