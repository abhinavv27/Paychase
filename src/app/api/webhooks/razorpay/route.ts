import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature') || ''

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)
  const { event: eventType, payload } = event

  if (eventType !== 'payment.captured') {
    return NextResponse.json({ status: 'ignored' })
  }

  const payment = payload.payment?.entity
  if (!payment) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = createClient()

  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      amount: payment.amount / 100,
      currency: payment.currency,
      method: payment.method,
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
      razorpay_signature: payment.signature,
      status: payment.status,
      captured_at: new Date(payment.created_at * 1000).toISOString(),
      user_id: payment.notes?.user_id || '',
      invoice_id: payment.notes?.invoice_id || '',
      client_id: payment.notes?.client_id || '',
    })

  if (paymentError) {
    if (paymentError.code === '23505') {
      return NextResponse.json({ status: 'duplicate' })
    }
    console.error('Failed to record payment:', paymentError)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }

  if (payment.notes?.invoice_id) {
    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_amount: payment.amount / 100,
        payment_date: new Date().toISOString(),
        payment_method: payment.method,
      })
      .eq('id', payment.notes.invoice_id)
  }

  await supabase
    .from('audit_log')
    .insert({
      user_id: payment.notes?.user_id || '',
      action: 'payment_received',
      entity_type: 'payment',
      entity_id: payment.id,
      details: {
        amount: payment.amount / 100,
        method: payment.method,
        invoice_id: payment.notes?.invoice_id,
      },
    })

  return NextResponse.json({ status: 'ok' })
}
