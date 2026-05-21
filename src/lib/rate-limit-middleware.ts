import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function withRateLimit(
  request: NextRequest,
  key: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const rateLimitKey = `ratelimit:${key}:${ip}`

  const result = await rateLimit(rateLimitKey, { maxRequests, windowSeconds })
  const headers = getRateLimitHeaders(result.remaining, result.reset)

  if (!result.success) {
    headers.set('Retry-After', Math.ceil((result.reset - Date.now()) / 1000).toString())
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429, headers }
    )
  }

  return null
}
