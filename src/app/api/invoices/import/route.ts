import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseCsvContent, importCsvRows } from '@/lib/invoices/csv-import'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const content = await file.text()
    const { rows, errors: parseErrors } = await parseCsvContent(content)

    if (rows.length === 0) {
      return NextResponse.json({ imported: 0, errors: parseErrors, skipped: 0 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 rows per import' }, { status: 400 })
    }

    const result = await importCsvRows(rows, user.id)
    result.errors = [...parseErrors, ...result.errors]

    revalidatePath('/invoices')
    revalidatePath('/clients')
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Import failed' }, { status: 500 })
  }
}
