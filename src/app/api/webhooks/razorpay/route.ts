import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api-helpers'
import { createAdminClient, asDb } from '@/lib/supabase/admin'
import crypto from 'crypto'

const POSTGRES_DUPLICATE_ERROR = '23505'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature') || ''

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET not configured')
    return apiError('Server misconfiguration', 500)
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  // Timing-safe comparison to prevent timing attacks
  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return apiError('Invalid signature', 400)
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(body)
  } catch {
    return apiError('Invalid JSON', 400)
  }

  const eventType = event.event as string | undefined
  const payload = event.payload as Record<string, unknown> | undefined

  if (eventType !== 'payment.captured') {
    return NextResponse.json({ status: 'ignored' })
  }

  if (!payload) {
    return apiError('Invalid payload', 400)
  }

  const payment = (payload as Record<string, unknown>).payment as Record<string, unknown> | undefined
  const paymentEntity = payment?.entity as Record<string, unknown> | undefined
  if (!paymentEntity) {
    return apiError('Invalid payload', 400)
  }

  const db = asDb(createAdminClient())

  const notes = paymentEntity.notes as Record<string, unknown> | undefined

  // Idempotency: check if payment already exists before inserting
  const { data: existingPayment } = await db
    .from('payments')
    .select('id')
    .eq('razorpay_payment_id', paymentEntity.id as string)
    .single()

  if (existingPayment) {
    return NextResponse.json({ status: 'duplicate' })
  }

  const { error: paymentError } = await db
    .from('payments')
    .insert({
      amount: (paymentEntity.amount as number) / 100,
      currency: paymentEntity.currency as string,
      method: paymentEntity.method as string,
      razorpay_payment_id: paymentEntity.id as string,
      razorpay_order_id: paymentEntity.order_id as string,
      razorpay_signature: paymentEntity.signature as string,
      status: paymentEntity.status as string,
      captured_at: new Date((paymentEntity.created_at as number) * 1000).toISOString(),
      user_id: (notes?.user_id as string) || '',
      invoice_id: (notes?.invoice_id as string) || '',
      client_id: (notes?.client_id as string) || '',
    })

  if (paymentError) {
    if (paymentError.code === POSTGRES_DUPLICATE_ERROR) {
      return NextResponse.json({ status: 'duplicate' })
    }
    console.error('Failed to record payment:', paymentError)
    return apiError('Failed to record payment', 500)
  }

  if (notes?.invoice_id) {
    // Idempotent: only update if not already paid
    const { error: updateError } = await db
      .from('invoices')
      .update({
        status: 'paid',
        paid_amount: (paymentEntity.amount as number) / 100,
        payment_date: new Date().toISOString(),
        payment_method: paymentEntity.method as string,
      })
      .eq('id', notes.invoice_id as string)
      .neq('status', 'paid')

    if (updateError) {
      console.error('Failed to update invoice status:', updateError)
    }
  }

  const { error: auditError } = await db
    .from('audit_log')
    .insert({
      user_id: (notes?.user_id as string) || '',
      action: 'payment_received',
      entity_type: 'payment',
      entity_id: paymentEntity.id as string,
      details: {
        amount: (paymentEntity.amount as number) / 100,
        method: paymentEntity.method as string,
        invoice_id: notes?.invoice_id as string,
      },
    } as Record<string, unknown>)

  if (auditError) {
    console.error('Failed to insert audit log:', auditError)
  }

  return NextResponse.json({ status: 'ok' })
}
