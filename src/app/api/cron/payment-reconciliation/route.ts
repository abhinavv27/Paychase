import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, asDb } from '@/lib/supabase/admin'
import { requireCronAuth, apiError } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const authError = requireCronAuth(request)
    if (authError) return authError

    const supabase = createAdminClient()
    const db = asDb(supabase)
    let reconciled = 0

    // 1. Find paid invoices that don't have matching payment records
    const { data: unmatched, error: unmatchedError } = await supabase
      .from('invoices')
      .select('id, user_id, client_id, amount, currency')
      .eq('status', 'paid')
      .is('payment_method', null)

    if (unmatchedError) {
      console.error('Failed to query unmatched invoices:', unmatchedError)
      return apiError(unmatchedError.message, 500)
    }

    if (unmatched) {
      const rows = unmatched as Array<{
        id: string
        user_id: string
        client_id: string
        amount: number
        currency: string
      }>
      for (const invoice of rows) {
        const { error: insertError } = await db.from('payments').insert({
          user_id: invoice.user_id,
          invoice_id: invoice.id,
          client_id: invoice.client_id,
          amount: invoice.amount,
          currency: invoice.currency,
          method: 'unknown',
          status: 'reconciled',
          captured_at: new Date().toISOString(),
        } as Record<string, unknown>)
        if (insertError) {
          console.error('Failed to insert reconciled payment for invoice', invoice.id, insertError)
          continue
        }
        reconciled++
      }
    }

    // 2. Find pending invoices past due with no reminder sent in 7 days — flag for review
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: staleInvoices, error: staleError } = await supabase
      .from('invoices')
      .select('id')
      .eq('status', 'pending')
      .lt('due_date', sevenDaysAgo)

    if (staleError) {
      console.error('Failed to query stale invoices:', staleError)
      return apiError(staleError.message, 500)
    }

    if (staleInvoices) {
      const rows = staleInvoices as Array<{ id: string }>
      for (const invoice of rows) {
        const { error: auditError } = await db.from('audit_log').insert({
          action: 'reconciliation_flag',
          entity_type: 'invoice',
          entity_id: invoice.id,
          details: { reason: 'stale_pending_7days' },
        } as Record<string, unknown>)
        if (auditError) {
          console.error('Failed to insert audit log for stale invoice', invoice.id, auditError)
        }
      }
    }

    return NextResponse.json({ status: 'ok', reconciled })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Payment reconciliation failed:', error)
    return apiError(message, 500)
  }
}
