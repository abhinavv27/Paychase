const mockLimit = jest.fn()

jest.mock('@upstash/ratelimit', () => {
  const mockRatelimit = jest.fn().mockImplementation(() => ({
    limit: mockLimit,
  }))
  mockRatelimit.slidingWindow = jest.fn()
  return { Ratelimit: mockRatelimit }
})

jest.mock('@upstash/redis', () => ({
  Redis: { fromEnv: jest.fn() },
}))

describe('checkRateLimit', () => {
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

    jest.resetModules()
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('test-key')

    expect(result.success).toBe(true)
    expect(result.limit).toBe(0)
    expect(result.remaining).toBe(0)
    expect(result.reset).toBe(0)
    expect(mockLimit).not.toHaveBeenCalled()
  })

  it('allows requests under the limit', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    mockLimit.mockResolvedValue({ success: true, limit: 100, remaining: 85, reset: Date.now() + 60000 })

    jest.resetModules()
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('test-user')

    expect(result.success).toBe(true)
    expect(mockLimit).toHaveBeenCalledWith('test-user')
  })

  it('blocks requests over the limit', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    mockLimit.mockResolvedValue({ success: false, limit: 100, remaining: 0, reset: Date.now() + 60000 })

    jest.resetModules()
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('test-user')

    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('returns limit and reset values from ratelimit', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
    mockLimit.mockResolvedValue({ success: true, limit: 100, remaining: 42, reset: 5000 })

    jest.resetModules()
    const { checkRateLimit } = await import('@/lib/rate-limit')
    const result = await checkRateLimit('test-user')

    expect(result.limit).toBe(100)
    expect(result.remaining).toBe(42)
    expect(result.reset).toBe(5000)
  })
})
