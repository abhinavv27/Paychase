import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaymentLink } from '@/lib/razorpay'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, client:clients(name, email, phone)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (invoiceError || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  try {
    const link = await createPaymentLink({
      amount: invoice.amount,
      currency: invoice.currency,
      description: `Payment for invoice ${invoice.invoice_number}`,
      customer: {
        name: (invoice.client as any)?.name || 'Customer',
        email: (invoice.client as any)?.email,
        phone: (invoice.client as any)?.phone,
      },
      notes: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        user_id: user.id,
      },
    })

    await supabase
      .from('invoices')
      .update({ upi_link: link.short_url })
      .eq('id', invoice.id)

    return NextResponse.json({ url: link.short_url, id: link.id })
  } catch (error) {
    console.error('Failed to create payment link:', error)
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    )
  }
}
