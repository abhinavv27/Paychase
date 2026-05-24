import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit-middleware'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-helpers'
import { validateCsvContent } from '@/lib/csv/import'

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'csv-import', 10, 3600)
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

  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 })
  }

  // Import clients first
  if (validation.clients.length > 0) {
    const { error: clientError } = await supabase
      .from('clients')
      .insert(validation.clients)
    if (clientError) {
      return apiError(clientError.message, 500)
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
  const invoicesWithClientIds = validation.invoices.map((inv) => {
    const { _clientName, ...invoiceData } = inv
    return {
      ...invoiceData,
      client_id: clientNameToId.get(_clientName.toLowerCase()) || '',
    }
  })

  // Import invoices
  if (invoicesWithClientIds.length > 0) {
    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoicesWithClientIds)
    if (invoiceError) {
      return apiError(invoiceError.message, 500)
    }
  }

  return NextResponse.json({
    clients: validation.clients.length,
    invoices: validation.invoices.length,
    warnings: validation.warnings,
  })
}
