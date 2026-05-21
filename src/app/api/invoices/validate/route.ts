import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCsvContent } from '@/lib/csv/import'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { content } = body

  if (!content) {
    return NextResponse.json({ error: 'No CSV content' }, { status: 400 })
  }

  const validation = validateCsvContent(content, user.id)

  return NextResponse.json(validation)
}
