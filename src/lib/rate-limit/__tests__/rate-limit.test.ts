const mockExec = jest.fn()

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    pipeline: jest.fn().mockReturnValue({
      zremrangebyscore: jest.fn().mockReturnThis(),
      zcard: jest.fn().mockReturnThis(),
      zadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: mockExec,
    }),
  })),
}))

import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('skips rate limiting when env vars are not set', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const result = await rateLimit('test-key')

    expect(result.success).toBe(true)
    expect(result.remaining).toBe(100)
    expect(result.reset).toBeGreaterThan(0)
    expect(mockExec).not.toHaveBeenCalled()
  })

  it('allows requests under the limit', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    mockExec.mockResolvedValue([0, 5, 1, 1])

    const result = await rateLimit('test-key', { maxRequests: 10, windowSeconds: 60 })

    expect(result.success).toBe(true)
    expect(result.remaining).toBe(5)
    expect(mockExec).toHaveBeenCalled()
  })

  it('blocks requests over the limit', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    mockExec.mockResolvedValue([0, 15, 1, 1])

    const result = await rateLimit('test-key', { maxRequests: 10, windowSeconds: 60 })

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('resets after window expires', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    mockExec.mockResolvedValue([0, 0, 1, 1])

    const result = await rateLimit('test-key', { maxRequests: 10, windowSeconds: 60 })

    expect(result.success).toBe(true)
    expect(result.remaining).toBe(10)
    expect(result.reset).toBeGreaterThan(Date.now())
  })
})
