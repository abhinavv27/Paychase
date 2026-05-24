import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-helpers'
import { validateCsvContent } from '@/lib/csv/import'
import { withRateLimit } from '@/lib/rate-limit-middleware'

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'csv-validate', 30, 60)
  if (rateLimitResponse) return rateLimitResponse

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }

  const body = await request.json()
  const { content } = body

  if (!content) {
    return apiError('No CSV content', 400)
  }

  const validation = validateCsvContent(content, user.id)

  return NextResponse.json(validation)
}
