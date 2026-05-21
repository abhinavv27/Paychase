import { createClient } from '@/lib/supabase/server'
import { calculateRiskScore, predictPaymentDate } from '@/lib/ai'
import { RiskDistribution } from '@/components/analytics/risk-distribution'
import { StatCard } from '@/components/analytics/stat-card'
import { AlertTriangle, TrendingUp, Calendar, DollarSign } from 'lucide-react'

interface ClientRiskData {
  id: string
  name: string
  email: string | null
  risk_score: number
  on_time_rate: number
  avg_payment_delay_days: number
  total_invoices: number
  total_outstanding: number
}

interface LatePaymentPrediction {
  client_name: string
  invoice_number: string
  amount: number
  risk_score: number
  predicted_date: Date
  confidence_low: Date
  confidence_high: Date
  days_until_due: number
}

async function fetchClientRiskData(): Promise<ClientRiskData[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('risk_score', { ascending: false })

  if (error) {
    console.error('Error fetching client risk data:', error)
    return []
  }

  return data as ClientRiskData[]
}

async function fetchInvoices(): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, clients(name)')
    .eq('status', 'pending')

  if (error) {
    console.error('Error fetching invoices:', error)
    return []
  }

  return data
}

async function fetchReminders(): Promise<any[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('reminders')
    .select('sent_at, read_at, responded_at')

  if (error) {
    console.error('Error fetching reminders:', error)
    return []
  }

  return data
}

function getOptimalCollectionDay(reminders: any[]): string {
  if (reminders.length === 0) return 'Tuesday'

  const dayResponses: Record<number, number> = {}
  for (let d = 0; d < 7; d++) dayResponses[d] = 0

  for (const reminder of reminders) {
    if (reminder.responded_at || reminder.read_at) {
      const responseTime = new Date(reminder.responded_at || reminder.read_at)
      const day = responseTime.getDay()
      dayResponses[day]++
    }
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  let maxDay = 2
  let maxCount = 0
  for (const [day, count] of Object.entries(dayResponses)) {
    if (count > maxCount) {
      maxCount = count
      maxDay = parseInt(day)
    }
  }

  return dayNames[maxDay]
}

export default async function InsightsPage() {
  const clients = await fetchClientRiskData()
  const invoices = await fetchInvoices()
  const reminders = await fetchReminders()

  const predictions: LatePaymentPrediction[] = []
  let lowRisk = 0
  let mediumRisk = 0
  let highRisk = 0
  let atRiskAmount = 0

  for (const client of clients) {
    const riskScore = calculateRiskScore(
      {
        on_time_rate: client.on_time_rate,
        avg_payment_delay_days: client.avg_payment_delay_days,
        total_invoices: client.total_invoices,
      },
      { due_date: new Date() }
    )

    if (riskScore > 0.7) {
      highRisk++
      atRiskAmount += client.total_outstanding

      for (const invoice of invoices.filter((inv) => inv.client_id === client.id)) {
        const prediction = predictPaymentDate(
          { avg_payment_delay_days: client.avg_payment_delay_days },
          { due_date: invoice.due_date }
        )

        const daysUntilDue = Math.max(
          0,
          Math.floor(
            (new Date(invoice.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
        )

        predictions.push({
          client_name: client.name,
          invoice_number: invoice.invoice_number,
          amount: invoice.amount,
          risk_score: riskScore,
          predicted_date: prediction.predicted_date,
          confidence_low: prediction.confidence_low,
          confidence_high: prediction.confidence_high,
          days_until_due: daysUntilDue,
        })
      }
    } else if (riskScore > 0.4) {
      mediumRisk++
    } else {
      lowRisk++
    }
  }

  const optimalCollectionDay = getOptimalCollectionDay(reminders)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
        <p className="mt-1 text-sm text-gray-500">
          Predictive analytics and risk assessments for your receivables.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="High Risk Clients"
          value={String(highRisk)}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          title="At-Risk Amount"
          value={`₹${atRiskAmount.toLocaleString('en-IN')}`}
          change={{ value: '₹0', positive: false }}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Optimal Collection Day"
          value={optimalCollectionDay}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          title="Total Predictions"
          value={String(predictions.length)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Risk distribution */}
      <RiskDistribution low={lowRisk} medium={mediumRisk} high={highRisk} />

      {/* Late payment predictions */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Late Payment Predictions
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Clients predicted to pay late (risk score &gt; 0.7)
          </p>
        </div>

        {predictions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              No high-risk predictions yet. Add more invoice data to enable AI predictions.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {predictions.map((prediction, index) => (
              <div
                key={index}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {prediction.client_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Invoice {prediction.invoice_number}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Predicted: {prediction.predicted_date.toLocaleDateString()}
                    {' '}({prediction.confidence_low.toLocaleDateString()} - {prediction.confidence_high.toLocaleDateString()})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₹{prediction.amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-red-600">
                    Risk: {(prediction.risk_score * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {prediction.days_until_due === 0
                      ? 'Due today'
                      : prediction.days_until_due < 0
                      ? `${Math.abs(prediction.days_until_due)} days overdue`
                      : `${prediction.days_until_due} days until due`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
