import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit-middleware'
import { createClient } from '@/lib/supabase/server'
import { validateCsvContent } from '@/lib/csv/import'

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'csv-import', 10, 3600)
  if (rateLimitResponse) return rateLimitResponse

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

  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 })
  }

  // Import clients first
  if (validation.clients.length > 0) {
    const { error: clientError } = await supabase
      .from('clients')
      .insert(validation.clients)
    if (clientError) {
      return NextResponse.json({ error: clientError.message }, { status: 500 })
    }
  }

  // Fetch created clients to map names to IDs
  const { data: createdClients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', user.id)

  const clientNameToId = new Map(
    createdClients?.map((c) => [c.name.toLowerCase(), c.id]) || []
  )

  // Link invoices to clients
  const invoicesWithClientIds = validation.invoices.map((inv) => ({
    ...inv,
    client_id: clientNameToId.get(inv.user_id) || '',
  }))

  // Import invoices
  if (invoicesWithClientIds.length > 0) {
    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoicesWithClientIds)
    if (invoiceError) {
      return NextResponse.json({ error: invoiceError.message }, { status: 500 })
    }
  }

  return NextResponse.json({
    clients: validation.clients.length,
    invoices: validation.invoices.length,
    warnings: validation.warnings,
  })
}
