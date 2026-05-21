import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaymentLink } from '@/lib/razorpay'

interface InvoiceWithClient {
  id: string
  amount: number
  currency: string
  invoice_number: string
  client: { name: string; email: string | null; phone: string | null } | null
}

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

  const typedInvoice = invoice as unknown as InvoiceWithClient

  try {
    const link = await createPaymentLink({
      amount: typedInvoice.amount,
      currency: typedInvoice.currency,
      description: `Payment for invoice ${typedInvoice.invoice_number}`,
      customer: {
        name: typedInvoice.client?.name || 'Customer',
        email: typedInvoice.client?.email || undefined,
        phone: typedInvoice.client?.phone || undefined,
      },
      notes: {
        invoice_id: typedInvoice.id,
        invoice_number: typedInvoice.invoice_number,
        user_id: user.id,
      },
    })

    await supabase
      .from('invoices')
      .update({ upi_link: link.short_url })
      .eq('id', typedInvoice.id)

    return NextResponse.json({ url: link.short_url, id: link.id })
  } catch (error) {
    console.error('Failed to create payment link:', error)
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    )
  }
}
