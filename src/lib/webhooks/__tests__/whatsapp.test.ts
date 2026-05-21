import { NextRequest } from 'next/server'

describe('WhatsApp Webhook Handler', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv, WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'test_verify_token' }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('GET - Webhook Verification', () => {
    it('should return challenge when verification token matches', async () => {
      const MockNextResponse = jest.fn().mockImplementation((body, init) => ({
        status: init?.status || 200,
        body,
        json: async () => body,
      }))

      jest.mock('next/server', () => ({
        NextRequest: class NextRequest {
          url: string
          constructor(url: string) {
            this.url = url
          }
        },
        NextResponse: MockNextResponse,
      }))

      const { GET } = await import('@/app/api/webhooks/whatsapp/route')

      const request = new NextRequest(
        'http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=CHALLENGE_ACCEPTED'
      )

      const response = await GET(request as any)
      expect(response.status).toBe(200)
      expect(response.body).toBe('CHALLENGE_ACCEPTED')
    })

    it('should return 403 when verification token does not match', async () => {
      jest.mock('next/server', () => ({
        NextRequest: class NextRequest {
          url: string
          constructor(url: string) {
            this.url = url
          }
        },
        NextResponse: {
          json: (body: any, init?: { status?: number }) => ({
            status: init?.status || 200,
            json: async () => body,
          }),
        },
      }))

      const { GET } = await import('@/app/api/webhooks/whatsapp/route')

      const request = new NextRequest(
        'http://localhost/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=CHALLENGE_ACCEPTED'
      )

      const response = await GET(request as any)
      expect(response.status).toBe(403)

      const json = await response.json()
      expect(json.error).toBe('Forbidden')
    })

    it('should return 403 when mode is not subscribe', async () => {
      jest.mock('next/server', () => ({
        NextRequest: class NextRequest {
          url: string
          constructor(url: string) {
            this.url = url
          }
        },
        NextResponse: {
          json: (body: any, init?: { status?: number }) => ({
            status: init?.status || 200,
            json: async () => body,
          }),
        },
      }))

      const { GET } = await import('@/app/api/webhooks/whatsapp/route')

      const request = new NextRequest(
        'http://localhost/api/webhooks/whatsapp?hub.mode=publish&hub.verify_token=test_verify_token&hub.challenge=CHALLENGE_ACCEPTED'
      )

      const response = await GET(request as any)
      expect(response.status).toBe(403)
    })
  })

  describe('POST - Delivery Status Updates', () => {
    it('should update reminder status to delivered on delivered webhook', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ data: null, error: null })
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null })
      mockUpdate.mockReturnValue({ eq: mockEq })

      const mockFrom = jest.fn().mockReturnValue({
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
          async json() { return this.init.body }
          headers = { get: () => null }
        },
        NextResponse: {
          json: (body: any, init?: { status?: number }) => ({
            status: init?.status || 200,
            json: async () => body,
          }),
        },
      }))

      const { POST } = await import('@/app/api/webhooks/whatsapp/route')

      const body = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: 'wamid_test123',
                      status: 'delivered',
                      recipient_id: '919876543210',
                    },
                  ],
                  messages: [],
                },
              },
            ],
          },
        ],
      }

      const request = new NextRequest('http://localhost/api/webhooks/whatsapp', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const response = await POST(request as any)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.status).toBe('ok')

      expect(mockFrom).toHaveBeenCalledWith('reminders')
      expect(mockUpdate).toHaveBeenCalledWith({
        delivered_at: expect.any(String),
        status: 'delivered',
      })
      expect(mockEq).toHaveBeenCalledWith('whatsapp_message_id', 'wamid_test123')
    })

    it('should update reminder status to read on read webhook', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ data: null, error: null })
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null })
      mockUpdate.mockReturnValue({ eq: mockEq })

      const mockFrom = jest.fn().mockReturnValue({
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
          async json() { return this.init.body }
          headers = { get: () => null }
        },
        NextResponse: {
          json: (body: any, init?: { status?: number }) => ({
            status: init?.status || 200,
            json: async () => body,
          }),
        },
      }))

      const { POST } = await import('@/app/api/webhooks/whatsapp/route')

      const body = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: 'wamid_test123',
                      status: 'read',
                      recipient_id: '919876543210',
                    },
                  ],
                  messages: [],
                },
              },
            ],
          },
        ],
      }

      const request = new NextRequest('http://localhost/api/webhooks/whatsapp', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const response = await POST(request as any)
      expect(response.status).toBe(200)

      expect(mockUpdate).toHaveBeenCalledWith({
        read_at: expect.any(String),
        status: 'read',
      })
      expect(mockEq).toHaveBeenCalledWith('whatsapp_message_id', 'wamid_test123')
    })

    it('should update reminder with error on failed webhook', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ data: null, error: null })
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null })
      mockUpdate.mockReturnValue({ eq: mockEq })

      const mockFrom = jest.fn().mockReturnValue({
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
          async json() { return this.init.body }
          headers = { get: () => null }
        },
        NextResponse: {
          json: (body: any, init?: { status?: number }) => ({
            status: init?.status || 200,
            json: async () => body,
          }),
        },
      }))

      const { POST } = await import('@/app/api/webhooks/whatsapp/route')

      const body = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: 'wamid_test123',
                      status: 'failed',
                      recipient_id: '919876543210',
                      errors: [
                        {
                          code: 1234,
                          message: 'Message undeliverable',
                        },
                      ],
                    },
                  ],
                  messages: [],
                },
              },
            ],
          },
        ],
      }

      const request = new NextRequest('http://localhost/api/webhooks/whatsapp', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const response = await POST(request as any)
      expect(response.status).toBe(200)

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'failed',
        error_message: 'Message undeliverable',
      })
      expect(mockEq).toHaveBeenCalledWith('whatsapp_message_id', 'wamid_test123')
    })

    it('should mark reminder as responded on incoming message', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({ data: null, error: null })
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null })
      mockUpdate.mockReturnValue({ eq: mockEq })

      const mockFrom = jest.fn().mockReturnValue({
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
          async json() { return this.init.body }
          headers = { get: () => null }
        },
        NextResponse: {
          json: (body: any, init?: { status?: number }) => ({
            status: init?.status || 200,
            json: async () => body,
          }),
        },
      }))

      const { POST } = await import('@/app/api/webhooks/whatsapp/route')

      const timestamp = Math.floor(Date.now() / 1000)

      const body = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [],
                  messages: [
                    {
                      from: '919876543210',
                      id: 'wamid_test123',
                      timestamp: timestamp.toString(),
                      type: 'text',
                      text: { body: 'Yes, I will pay' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      }

      const request = new NextRequest('http://localhost/api/webhooks/whatsapp', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      const response = await POST(request as any)
      expect(response.status).toBe(200)

      const expectedRespondedAt = new Date(timestamp * 1000).toISOString()

      expect(mockFrom).toHaveBeenCalledWith('reminders')
      expect(mockUpdate).toHaveBeenCalledWith({
        responded_at: expectedRespondedAt,
        status: 'responded',
      })
      expect(mockEq).toHaveBeenCalledWith('whatsapp_message_id', 'wamid_test123')
    })

    it('should return ignored when entry is missing', async () => {
      jest.mock('next/server', () => ({
        NextRequest: class NextRequest {
          url: string
          init: RequestInit
          constructor(url: string, init: RequestInit) {
            this.url = url
            this.init = init
          }
          async json() { return this.init.body }
          headers = { get: () => null }
        },
        NextResponse: {
          json: (body: any, init?: { status?: number }) => ({
            status: init?.status || 200,
            json: async () => body,
          }),
        },
      }))

      const { POST } = await import('@/app/api/webhooks/whatsapp/route')

      const request = new NextRequest('http://localhost/api/webhooks/whatsapp', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request as any)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.status).toBe('ignored')
    })
  })
})
