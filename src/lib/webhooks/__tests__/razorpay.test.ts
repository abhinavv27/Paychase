import crypto from 'crypto'
import { NextRequest } from 'next/server'

type PaymentPayload = {
  id: string
  amount: number
  currency: string
  method: string
  order_id: string
  signature?: string
  status: string
  created_at: number
  notes?: {
    user_id?: string
    invoice_id?: string
    client_id?: string
  }
}

function createWebhookBody(event: string, payment: PaymentPayload): string {
  return JSON.stringify({
    event,
    payload: {
      payment: {
        entity: payment,
      },
    },
  })
}

function createSignature(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

describe('Razorpay Webhook Handler', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, RAZORPAY_WEBHOOK_SECRET: 'test_webhook_secret' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should reject requests with invalid signature', async () => {
    const { POST } = await import('@/app/api/webhooks/razorpay/route')

    const body = createWebhookBody('payment.captured', {
      id: 'pay_test123',
      amount: 5000,
      currency: 'INR',
      method: 'upi',
      order_id: 'order_test123',
      status: 'captured',
      created_at: Math.floor(Date.now() / 1000),
    })

    const request = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'x-razorpay-signature': 'invalid_signature',
      },
      body,
    })

    const response = await POST(request as any)
    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json.error).toBe('Invalid signature')
  })

  it('should record payment and update invoice on valid signature', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ data: null, error: null })
    const mockEq = jest.fn().mockResolvedValue({ data: null, error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null })
    const mockFrom = jest.fn().mockReturnValue({
      insert: mockInsert,
      update: mockUpdate,
    })
    const mockCreateClient = jest.fn().mockReturnValue({ from: mockFrom })

    jest.mock('@/lib/supabase/server', () => ({
      createClient: mockCreateClient,
    }))

    jest.mock('next/server', () => ({
      NextRequest: class NextRequest {
        url: string
        init: RequestInit
        constructor(url: string, init: RequestInit) {
          this.url = url
          this.init = init
        }
        async json() { return JSON.parse(this.init.body as string) }
        async text() { return this.init.body as string }
        headers = {
          get: (name: string) => {
            if (name === 'x-razorpay-signature') {
              const body = this.init.body as string
              return createSignature(body, 'test_webhook_secret')
            }
            return null
          }
        }
      },
      NextResponse: {
        json: (body: any, init?: { status?: number }) => ({
          status: init?.status || 200,
          json: async () => body,
        }),
      },
    }))

    const { POST } = await import('@/app/api/webhooks/razorpay/route')

    const payment: PaymentPayload = {
      id: 'pay_test123',
      amount: 5000,
      currency: 'INR',
      method: 'upi',
      order_id: 'order_test123',
      status: 'captured',
      created_at: Math.floor(Date.now() / 1000),
      notes: {
        user_id: 'user_1',
        invoice_id: 'inv_1',
        client_id: 'client_1',
      },
    }

    const body = createWebhookBody('payment.captured', payment)

    const request = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'x-razorpay-signature': createSignature(body, 'test_webhook_secret'),
      },
      body,
    })

    const response = await POST(request as any)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.status).toBe('ok')

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 50,
        currency: 'INR',
        method: 'upi',
        razorpay_payment_id: 'pay_test123',
        razorpay_order_id: 'order_test123',
        status: 'captured',
        user_id: 'user_1',
        invoice_id: 'inv_1',
        client_id: 'client_1',
      })
    )

    expect(mockFrom).toHaveBeenCalledWith('invoices')
    expect(mockUpdate).toHaveBeenCalledWith({
      status: 'paid',
      paid_amount: 50,
      payment_date: expect.any(String),
      payment_method: 'upi',
    })
    expect(mockEq).toHaveBeenCalledWith('id', 'inv_1')
  })

  it('should return duplicate status on unique constraint violation', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    })
    const mockFrom = jest.fn().mockReturnValue({
      insert: mockInsert,
    })
    const mockCreateClient = jest.fn().mockReturnValue({ from: mockFrom })

    jest.mock('@/lib/supabase/server', () => ({
      createClient: mockCreateClient,
    }))

    jest.mock('next/server', () => ({
      NextRequest: class NextRequest {
        url: string
        init: RequestInit
        constructor(url: string, init: RequestInit) {
          this.url = url
          this.init = init
        }
        async json() { return JSON.parse(this.init.body as string) }
        async text() { return this.init.body as string }
        headers = {
          get: (name: string) => {
            if (name === 'x-razorpay-signature') {
              const body = this.init.body as string
              return createSignature(body, 'test_webhook_secret')
            }
            return null
          }
        }
      },
      NextResponse: {
        json: (body: any, init?: { status?: number }) => ({
          status: init?.status || 200,
          json: async () => body,
        }),
      },
    }))

    const { POST } = await import('@/app/api/webhooks/razorpay/route')

    const payment: PaymentPayload = {
      id: 'pay_test123',
      amount: 5000,
      currency: 'INR',
      method: 'upi',
      order_id: 'order_test123',
      status: 'captured',
      created_at: Math.floor(Date.now() / 1000),
    }

    const body = createWebhookBody('payment.captured', payment)

    const request = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'x-razorpay-signature': createSignature(body, 'test_webhook_secret'),
      },
      body,
    })

    const response = await POST(request as any)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.status).toBe('duplicate')
  })

  it('should ignore non-payment.captured events', async () => {
    jest.mock('@/lib/supabase/server', () => ({
      createClient: jest.fn(),
    }))

    jest.mock('next/server', () => ({
      NextRequest: class NextRequest {
        url: string
        init: RequestInit
        constructor(url: string, init: RequestInit) {
          this.url = url
          this.init = init
        }
        async json() { return JSON.parse(this.init.body as string) }
        async text() { return this.init.body as string }
        headers = {
          get: (name: string) => {
            if (name === 'x-razorpay-signature') {
              const body = this.init.body as string
              return createSignature(body, 'test_webhook_secret')
            }
            return null
          }
        }
      },
      NextResponse: {
        json: (body: any, init?: { status?: number }) => ({
          status: init?.status || 200,
          json: async () => body,
        }),
      },
    }))

    const { POST } = await import('@/app/api/webhooks/razorpay/route')

    const payment: PaymentPayload = {
      id: 'pay_test123',
      amount: 5000,
      currency: 'INR',
      method: 'upi',
      order_id: 'order_test123',
      status: 'captured',
      created_at: Math.floor(Date.now() / 1000),
    }

    const body = createWebhookBody('payment.failed', payment)

    const request = new NextRequest('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'x-razorpay-signature': createSignature(body, 'test_webhook_secret'),
      },
      body,
    })

    const response = await POST(request as any)
    expect(response.status).toBe(200)

    const json = await response.json()
    expect(json.status).toBe('ignored')
  })
})
