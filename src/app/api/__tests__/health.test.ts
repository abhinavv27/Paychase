import { GET } from '../health/route'

// Mock the admin client
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => ({ error: null })),
      })),
    })),
  })),
  asDb: jest.fn((client: unknown) => client),
}))

describe('GET /api/health', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('returns ok when all checks pass', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test.com'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test'
    process.env.WHATSAPP_ACCESS_TOKEN = 'test'
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test'

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
  })

  it('returns degraded when env vars missing', async () => {
    delete process.env.WHATSAPP_ACCESS_TOKEN

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('degraded')
    expect(data.checks.env_WHATSAPP_ACCESS_TOKEN).toBe('missing')
  })
})
