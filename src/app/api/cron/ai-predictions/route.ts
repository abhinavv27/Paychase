import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, asDb } from '@/lib/supabase/admin'
import { calculateRiskScore, predictPaymentDate } from '@/lib/ai'
import { requireCronAuth, apiError } from '@/lib/api-helpers'

const BATCH_SIZE = 100

export async function GET(request: NextRequest) {
  try {
    const authError = requireCronAuth(request)
    if (authError) return authError

    const supabase = createAdminClient()

    let offset = 0
    let totalProcessed = 0
    let hasMore = true

    while (hasMore) {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .range(offset, offset + BATCH_SIZE - 1)

      if (error || !clients || clients.length === 0) {
        hasMore = false
        continue
      }

      const typedClients = clients as Array<{
        id: string
        user_id: string
        on_time_rate: number
        avg_payment_delay_days: number
        total_invoices: number
      }>

      // Batch: fetch all latest invoices for this batch in a single query
      const clientIds = typedClients.map((c) => c.id)
      const { data: latestInvoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('client_id, id, due_date')
        .in('client_id', clientIds)
        .order('due_date', { ascending: false })

      if (invoicesError) {
        console.error('Failed to fetch latest invoices:', invoicesError)
        hasMore = false
        continue
      }

      // Deduplicate to get only the latest invoice per client
      const invoiceMap = new Map<string, { client_id: string; id: string; due_date: string }>()
      if (latestInvoices) {
        const typedInvoices = latestInvoices as Array<{ client_id: string; id: string; due_date: string }>
        for (const inv of typedInvoices) {
          if (!invoiceMap.has(inv.client_id)) {
            invoiceMap.set(inv.client_id, inv)
          }
        }
      }

      // Batch updates
      const clientUpdates: { id: string; risk_score: number }[] = []
      interface PredictionInsert {
        user_id: string
        client_id: string
        invoice_id: string
        predicted_payment_date: string
        predicted_late_probability: number
        confidence_interval_low: string
        confidence_interval_high: string
        model_version: string
        features_used: Record<string, unknown>
      }

      const predictionInserts: PredictionInsert[] = []

      for (const client of typedClients) {
        const latestInvoice = invoiceMap.get(client.id)
        if (!latestInvoice) continue

        const riskScore = calculateRiskScore(
          {
            on_time_rate: client.on_time_rate,
            avg_payment_delay_days: client.avg_payment_delay_days,
            total_invoices: client.total_invoices,
          },
          {
            due_date: latestInvoice.due_date,
          }
        )

        const prediction = predictPaymentDate(
          {
            avg_payment_delay_days: client.avg_payment_delay_days,
          },
          {
            due_date: latestInvoice.due_date,
          }
        )

        clientUpdates.push({ id: client.id, risk_score: riskScore })

        predictionInserts.push({
          user_id: client.user_id,
          client_id: client.id,
          invoice_id: latestInvoice.id,
          predicted_payment_date: prediction.predicted_date.toISOString().split('T')[0],
          predicted_late_probability: riskScore,
          confidence_interval_low: prediction.confidence_low.toISOString().split('T')[0],
          confidence_interval_high: prediction.confidence_high.toISOString().split('T')[0],
          model_version: 'v1',
          features_used: {
            on_time_rate: client.on_time_rate,
            avg_payment_delay_days: client.avg_payment_delay_days,
            total_invoices: client.total_invoices,
          },
        })

        totalProcessed++
      }

      // Batch write
      if (clientUpdates.length > 0) {
        for (const update of clientUpdates) {
          const { error: updateError } = await asDb(supabase).from('clients').update({ risk_score: update.risk_score }).eq('id', update.id)
          if (updateError) {
            console.error('Failed to update risk score for client', update.id, updateError)
          }
        }
      }

      if (predictionInserts.length > 0) {
        const { error: insertError } = await asDb(supabase).from('ai_predictions').insert(predictionInserts as unknown as Record<string, unknown>[])
        if (insertError) {
          console.error('Failed to insert predictions:', insertError)
        }
      }

      offset += BATCH_SIZE
      if (typedClients.length < BATCH_SIZE) {
        hasMore = false
      }
    }

    return NextResponse.json({
      status: 'ok',
      processed: totalProcessed,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('AI predictions failed:', error)
    return apiError(message, 500)
  }
}
