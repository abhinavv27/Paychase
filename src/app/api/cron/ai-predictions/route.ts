import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateRiskScore, predictPaymentDate } from '@/lib/ai'

const BATCH_SIZE = 100

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

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

    for (const client of clients) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', client.id)
        .order('due_date', { ascending: false })
        .limit(1)

      if (!invoices || invoices.length === 0) continue

      const latestInvoice = invoices[0]

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

      await supabase
        .from('clients')
        .update({ risk_score: riskScore })
        .eq('id', client.id)

      await supabase
        .from('ai_predictions')
        .insert({
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

    offset += BATCH_SIZE
    if (clients.length < BATCH_SIZE) {
      hasMore = false
    }
  }

  return NextResponse.json({
    status: 'ok',
    processed: totalProcessed,
  })
}
