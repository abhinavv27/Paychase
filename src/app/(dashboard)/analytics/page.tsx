import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Clock, CheckCircle, MessageSquare, Mail, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/analytics/stat-card'

export const metadata: Metadata = {
  title: 'Analytics',
}

interface PaymentData {
  id: string
  amount: number
  captured_at: string
  invoice_id: string
}

interface InvoiceData {
  id: string
  amount: number
  due_date: string
  issue_date: string
  status: string
  payment_date: string | null
}

interface ReminderData {
  id: string
  channel: string
  status: string
  delivered_at: string | null
  responded_at: string | null
}

async function fetchPayments(userId: string): Promise<PaymentData[]> {
  const supabase = createClient()
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .gte('captured_at', twelveMonthsAgo.toISOString())
    .order('captured_at', { ascending: false })

  if (error) throw error

  return data as PaymentData[]
}

async function fetchInvoices(userId: string): Promise<InvoiceData[]> {
  const supabase = createClient()
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .gte('issue_date', twelveMonthsAgo.toISOString())
    .order('issue_date', { ascending: false })

  if (error) throw error

  return data as InvoiceData[]
}

async function fetchReminders(userId: string): Promise<ReminderData[]> {
  const supabase = createClient()
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', twelveMonthsAgo.toISOString())

  if (error) throw error

  return data as ReminderData[]
}

function calculateDSO(invoices: InvoiceData[], payments: PaymentData[]): number {
  if (payments.length === 0 || invoices.length === 0) return 0

  let totalDays = 0
  let count = 0

  for (const payment of payments) {
    const invoice = invoices.find((inv) => inv.id === payment.invoice_id)
    if (invoice && invoice.issue_date) {
      const issueDate = new Date(invoice.issue_date)
      const paymentDate = new Date(payment.captured_at)
      const days = Math.floor(
        (paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (days >= 0) {
        totalDays += days
        count++
      }
    }
  }

  return count > 0 ? Math.round(totalDays / count) : 0
}

function calculateRecoveryRate(invoices: InvoiceData[]): number {
  if (invoices.length === 0) return 0

  const paidInvoices = invoices.filter((inv) => inv.status === 'paid' && inv.payment_date)
  const onTimePayments = paidInvoices.filter((inv) => {
    const dueDate = new Date(inv.due_date)
    const paymentDate = new Date(inv.payment_date!)
    return paymentDate <= dueDate
  })

  return Math.round((onTimePayments.length / invoices.length) * 100)
}

function calculateChannelEffectiveness(reminders: ReminderData[]): {
  whatsapp: { sent: number; delivered: number; responded: number; responseRate: number }
  email: { sent: number; delivered: number; responded: number; responseRate: number }
} {
  const whatsapp = reminders.filter((r) => r.channel === 'whatsapp')
  const email = reminders.filter((r) => r.channel === 'email')

  const whatsappResponded = whatsapp.filter((r) => r.responded_at).length
  const emailResponded = email.filter((r) => r.responded_at).length

  return {
    whatsapp: {
      sent: whatsapp.length,
      delivered: whatsapp.filter((r) => r.delivered_at).length,
      responded: whatsappResponded,
      responseRate: whatsapp.length > 0 ? Math.round((whatsappResponded / whatsapp.length) * 100) : 0,
    },
    email: {
      sent: email.length,
      delivered: email.filter((r) => r.delivered_at).length,
      responded: emailResponded,
      responseRate: email.length > 0 ? Math.round((emailResponded / email.length) * 100) : 0,
    },
  }
}

function calculateMonthlyTrends(payments: PaymentData[]): { month: string; count: number; amount: number }[] {
  const monthlyData: Record<string, { count: number; amount: number }> = {}

  for (const payment of payments) {
    const date = new Date(payment.captured_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, amount: 0 }
    }
    monthlyData[monthKey].count++
    monthlyData[monthKey].amount += payment.amount
  }

  return Object.entries(monthlyData)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
    .map(([key, data]) => {
      const [year, month] = key.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: data.count,
        amount: data.amount,
      }
    })
}

export default async function AnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let fetchError = false

  const [payments, invoices, reminders] = await Promise.all([
    fetchPayments(user.id).catch((e) => {
      console.error('Error fetching payments:', e)
      fetchError = true
      return [] as PaymentData[]
    }),
    fetchInvoices(user.id).catch((e) => {
      console.error('Error fetching invoices:', e)
      fetchError = true
      return [] as InvoiceData[]
    }),
    fetchReminders(user.id).catch((e) => {
      console.error('Error fetching reminders:', e)
      fetchError = true
      return [] as ReminderData[]
    }),
  ])

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  // Current period (last 30 days)
  const currInvoices = invoices.filter(inv => new Date(inv.issue_date) >= thirtyDaysAgo)
  const currPayments = payments.filter(p => new Date(p.captured_at) >= thirtyDaysAgo)
  const currTotalRecovered = currPayments.reduce((sum, p) => sum + p.amount, 0)

  // Previous period (30-60 days ago)
  const prevInvoices = invoices.filter(inv => {
    const d = new Date(inv.issue_date)
    return d >= sixtyDaysAgo && d < thirtyDaysAgo
  })
  const prevPayments = payments.filter(p => {
    const d = new Date(p.captured_at)
    return d >= sixtyDaysAgo && d < thirtyDaysAgo
  })
  const prevTotalRecovered = prevPayments.reduce((sum, p) => sum + p.amount, 0)

  const dso = calculateDSO(invoices, payments)
  const currDso = calculateDSO(currInvoices, currPayments)
  const prevDso = calculateDSO(prevInvoices, prevPayments)

  const recoveryRate = calculateRecoveryRate(invoices)
  const currRecoveryRate = calculateRecoveryRate(currInvoices)
  const prevRecoveryRate = calculateRecoveryRate(prevInvoices)

  const channelEffectiveness = calculateChannelEffectiveness(reminders)
  const monthlyTrends = calculateMonthlyTrends(payments)

  const totalRecovered = payments.reduce((sum, p) => sum + p.amount, 0)

  const dsoChange = dso > 0 ? currDso - prevDso : 0
  const dsoChangeText = dsoChange === 0 ? '0 days' : `${Math.abs(dsoChange)} days`
  const dsoPositive = dsoChange <= 0

  const rrChange = recoveryRate > 0 ? currRecoveryRate - prevRecoveryRate : 0
  const rrChangeText = rrChange === 0 ? '0%' : `${Math.abs(rrChange)}%`
  const rrPositive = rrChange >= 0

  const trChange = totalRecovered > 0 ? currTotalRecovered - prevTotalRecovered : 0
  const trChangeText = trChange === 0 ? '₹0' : `₹${Math.abs(trChange).toLocaleString('en-IN')}`
  const trPositive = trChange >= 0

  return (
    <div className="space-y-8">
      {fetchError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">
            Some data failed to load. Please try again.
          </p>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recovery Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your collection performance and recovery metrics.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="DSO (Days Sales Outstanding)"
          value={`${dso} days`}
          change={{ value: dsoChangeText, positive: dsoPositive }}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          title="Recovery Rate"
          value={`${recoveryRate}%`}
          change={{ value: rrChangeText, positive: rrPositive }}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard
          title="Total Recovered"
          value={`₹${totalRecovered.toLocaleString('en-IN')}`}
          change={{ value: trChangeText, positive: trPositive }}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Reminders Sent"
          value={String(reminders.length)}
          icon={<MessageSquare className="w-5 h-5" />}
        />
      </div>

      {/* Channel effectiveness */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Channel Effectiveness</h3>
        <p className="text-sm text-gray-500 mt-1">
          Comparison of WhatsApp vs Email reminder success rates
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WhatsApp */}
          <div className="rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">WhatsApp</p>
                <p className="text-sm text-gray-500">
                  {channelEffectiveness.whatsapp.responseRate}% response rate
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sent</span>
                <span className="font-medium">{channelEffectiveness.whatsapp.sent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivered</span>
                <span className="font-medium">{channelEffectiveness.whatsapp.delivered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Responded</span>
                <span className="font-medium">{channelEffectiveness.whatsapp.responded}</span>
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="rounded-lg border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-500">
                  {channelEffectiveness.email.responseRate}% response rate
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sent</span>
                <span className="font-medium">{channelEffectiveness.email.sent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Delivered</span>
                <span className="font-medium">{channelEffectiveness.email.delivered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Responded</span>
                <span className="font-medium">{channelEffectiveness.email.responded}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly trends */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Payment Trends</h3>
          <p className="text-sm text-gray-500 mt-1">
            Payments collected per month
          </p>
        </div>

        {monthlyTrends.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              No payment data yet. Payment trends will appear here once invoices are paid.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payments
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlyTrends.map((trend) => (
                  <tr key={trend.month} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {trend.month}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">
                      {trend.count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">
                      ₹{trend.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
