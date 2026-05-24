import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-helpers'
import { createPaymentLink } from '@/lib/razorpay'
import { withRateLimit } from '@/lib/rate-limit-middleware'

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
  const rateLimitResponse = await withRateLimit(request, 'payment-link', 10, 60)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, client:clients(name, email, phone)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (invoiceError || !invoice) {
    return apiError('Invoice not found', 404)
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

    const { error: updateError } = await supabase
      .from('invoices')
      .update({ upi_link: link.short_url })
      .eq('id', typedInvoice.id)

    if (updateError) {
      console.error('Failed to update invoice with payment link:', updateError)
      // Don't fail the response — the payment link was created
    }

    return NextResponse.json({ url: link.short_url, id: link.id })
  } catch (error) {
    console.error('Failed to create payment link:', error)
    return apiError('Failed to create payment link', 500)
  }
}
