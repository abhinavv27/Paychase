import Razorpay from 'razorpay'

function getRazorpay(): Razorpay {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  })
}

export async function createPaymentLink(params: {
  amount: number
  currency: string
  description: string
  customer: {
    name: string
    email?: string
    phone?: string
  }
  notes?: Record<string, string>
}): Promise<{
  id: string
  short_url: string
  status: string
}> {
  const razorpay = getRazorpay()
  const paymentLink = await razorpay.paymentLink.create({
    amount: params.amount * 100,
    currency: params.currency,
    accept_partial: false,
    description: params.description,
    customer: {
      name: params.customer.name,
      email: params.customer.email,
      contact: params.customer.phone,
    },
    notify: {
      sms: true,
      email: true,
    },
    notes: params.notes,
    callback_url: process.env.NEXT_PUBLIC_BASE_URL,
    callback_method: 'get',
  })

  return {
    id: paymentLink.id,
    short_url: paymentLink.short_url,
    status: paymentLink.status,
  }
}

export async function fetchPaymentLink(linkId: string): Promise<{
  id: string
  short_url: string
  status: string
  amount: number
  payments: Array<{
    id: string
    status: string
    amount: number
  }>
}> {
  const razorpay = getRazorpay()
  const paymentLink = await razorpay.paymentLink.fetch(linkId)
  const rawPayments = paymentLink.payments as unknown as Array<{ id: string; status: string; amount: number | string }> | undefined
  return {
    id: paymentLink.id,
    short_url: paymentLink.short_url,
    status: paymentLink.status,
    amount: Number(paymentLink.amount),
    payments: (rawPayments || []).map((p) => ({
      id: p.id,
      status: p.status,
      amount: Number(p.amount),
    })),
  }
}
