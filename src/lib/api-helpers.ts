import { NextRequest, NextResponse } from 'next/server'

export function requireCronAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError('Unauthorized', 401)
  }
  return null
}

export function apiError(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}
