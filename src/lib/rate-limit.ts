import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  windowSeconds: 60,
}

export async function rateLimit(
  key: string,
  config: RateLimitConfig = defaultConfig
): Promise<{
  success: boolean
  remaining: number
  reset: number
}> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { success: true, remaining: config.maxRequests, reset: 0 }
  }

  const now = Date.now()
  const windowStart = now - config.windowSeconds * 1000
  const pipeline = redis.pipeline()

  pipeline.zremrangebyscore(key, 0, windowStart)
  pipeline.zcard(key)
  pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` })
  pipeline.expire(key, config.windowSeconds * 2)

  const results = await pipeline.exec()
  const requestCount = results[1] as number

  const remaining = Math.max(0, config.maxRequests - requestCount)
  const reset = now + config.windowSeconds * 1000

  if (requestCount > config.maxRequests) {
    return { success: false, remaining: 0, reset }
  }

  return { success: true, remaining, reset }
}

export function getRateLimitHeaders(remaining: number, reset: number): Headers {
  const headers = new Headers()
  headers.set('X-RateLimit-Remaining', remaining.toString())
  headers.set('X-RateLimit-Reset', reset.toString())
  return headers
}
