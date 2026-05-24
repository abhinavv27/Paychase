import { validateEnv } from '../env'

describe('validateEnv', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  it('does not throw in dev mode when vars are missing', () => {
    Object.assign(process.env, { NODE_ENV: 'development' })
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(validateEnv).not.toThrow()
  })

  it('throws in production when vars are missing', () => {
    Object.assign(process.env, { NODE_ENV: 'production' })
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    expect(() => validateEnv()).toThrow()
  })

  it('does not throw when all vars are present', () => {
    Object.assign(process.env, { NODE_ENV: 'production' })
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test'
    process.env.WHATSAPP_ACCESS_TOKEN = 'test'
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test'
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test'
    process.env.WHATSAPP_APP_SECRET = 'test'
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test'
    process.env.CRON_SECRET = 'test'
    process.env.UPSTASH_REDIS_REST_URL = 'test'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'test'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test'
    expect(() => validateEnv()).not.toThrow()
  })
})
