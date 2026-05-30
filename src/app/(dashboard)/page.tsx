import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ActionBanner } from '@/components/dashboard/action-banner'
import { HealthScore } from '@/components/dashboard/health-score'
import { calculateCollectionHealth } from '@/lib/ai/collection-health'

export const metadata: Metadata = {
  title: 'Dashboard',
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function timeAgo(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return then.toLocaleDateString()
}

function calculateDSO(invoices: { issue_date: string; payment_date: string | null; status: string }[]): number {
  const paid = invoices.filter((i) => i.status === 'paid' && i.payment_date)
  if (paid.length === 0) return 0

  let totalDays = 0
  for (const inv of paid) {
    const issueDate = new Date(inv.issue_date)
    const paymentDate = new Date(inv.payment_date!)
    const days = Math.floor((paymentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
    if (days >= 0) totalDays += days
  }

  return Math.round(totalDays / paid.length)
}

export default async function OverviewPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    draftCountResult,
    invoicesResult,
    overdueResult,
    sentThisWeekResult,
    paymentsResult,
    recentRemindersResult,
    overdueClientsResult,
    approvalRateResult,
    allClientsResult,
  ] = await Promise.all([
    supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('approval_status', 'draft'),
    supabase
      .from('invoices')
      .select('amount, status, issue_date, payment_date')
      .eq('user_id', user!.id),
    supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('status', 'pending')
      .lt('due_date', today),
    supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('approval_status', 'sent')
      .gte('sent_at', weekAgo),
    supabase
      .from('payments')
      .select('amount')
      .eq('user_id', user!.id)
      .gte('captured_at', monthStart),
    supabase
      .from('reminders')
      .select('*, invoices(invoice_number, amount), clients(name)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('clients')
      .select('name, total_outstanding, risk_score')
      .eq('user_id', user!.id)
      .gt('total_outstanding', 0)
      .order('total_outstanding', { ascending: false })
      .limit(3),
    supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('approval_status', 'approved'),
    supabase
      .from('clients')
      .select('total_outstanding, risk_score')
      .eq('user_id', user!.id)
      .gt('total_outstanding', 0),
  ])

  const draftCount = draftCountResult.count ?? 0
  const totalOutstanding =
    invoicesResult.data
      ?.filter((i) => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0) ?? 0
  const overdueCount = overdueResult.count ?? 0
  const sentThisWeek = sentThisWeekResult.count ?? 0
  const collectedThisMonth =
    paymentsResult.data?.reduce((sum, p) => sum + p.amount, 0) ?? 0

  const recentActivity = recentRemindersResult.data ?? []
  const topOverdueClients = overdueClientsResult.data ?? []

  const allInvoices = (invoicesResult.data ?? []) as { amount: number; status: string; issue_date: string; payment_date: string | null }[]
  const paidCount = allInvoices.filter((i) => i.status === 'paid').length
  const recoveryRate = allInvoices.length > 0 ? Math.round((paidCount / allInvoices.length) * 100) : 0
  const dso = calculateDSO(allInvoices)

  const approvedCount = approvalRateResult.count ?? 0
  const totalReminders = (draftCountResult.count ?? 0) + (sentThisWeekResult.count ?? 0) + approvedCount
  const approvalRate = totalReminders > 0 ? Math.round((approvedCount / totalReminders) * 100) : 0

  const allClients = (allClientsResult.data ?? []) as { total_outstanding: number; risk_score: number }[]
  const highRiskOutstanding = allClients
    .filter((c) => (c.risk_score ?? 0) >= 70)
    .reduce((sum, c) => sum + (c.total_outstanding ?? 0), 0)

  const cashFlowForecast = Math.round(totalOutstanding * (recoveryRate / 100))

  const healthScore = calculateCollectionHealth({
    dso,
    recoveryRate,
    highRiskOutstanding,
    totalOutstanding,
    approvalRate,
    collectionVelocity: dso,
  })

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.email?.split('@')[0] || 'User'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what you need to do right now.
        </p>
      </div>

      {/* Action Banner */}
      <ActionBanner draftCount={draftCount} />

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Outstanding</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatINR(totalOutstanding)}
          </p>
          <p className="mt-1 text-sm text-gray-500">Pending invoices</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Overdue Invoices</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {overdueCount}
          </p>
          <p className="mt-1 text-sm text-gray-500">Past due date</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Messages Sent This Week</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {sentThisWeek}
          </p>
          <p className="mt-1 text-sm text-gray-500">Last 7 days</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Collected This Month</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {formatINR(collectedThisMonth)}
          </p>
          <p className="mt-1 text-sm text-gray-500">Payments received</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Cash Flow Forecast (30d)</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {formatINR(cashFlowForecast)}
          </p>
          <p className="mt-1 text-sm text-gray-500">Risk-weighted expected collection</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Recovery Rate</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {recoveryRate}%
          </p>
          <p className="mt-1 text-sm text-gray-500">Invoices paid</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Avg Collection Time</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {dso} days
          </p>
          <p className="mt-1 text-sm text-gray-500">Days to payment</p>
        </div>

        <HealthScore score={healthScore.score} level={healthScore.level} />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              No recent activity yet.
            </div>
          ) : (
            recentActivity.map((reminder) => {
              const statusLabel =
                reminder.approval_status === 'draft'
                  ? 'Draft created'
                  : reminder.approval_status === 'sent'
                    ? 'Reminder sent'
                    : reminder.approval_status === 'approved'
                      ? 'Approved'
                      : reminder.status
              const relativeTime = reminder.created_at
                ? timeAgo(reminder.created_at)
                : 'Unknown'

              return (
                <div
                  key={reminder.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {statusLabel}
                    </p>
                    <p className="text-sm text-gray-500">
                      {reminder.clients?.name ?? 'Unknown client'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatINR(reminder.invoices?.amount ?? 0)}
                    </p>
                    <p className="text-xs text-gray-500">{relativeTime}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Top Overdue Clients */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Top Overdue Clients
          </h2>
        </div>
        <div className="divide-y divide-gray-200">
          {topOverdueClients.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              No overdue clients. Great job!
            </div>
          ) : (
            topOverdueClients.map((client) => {
              const riskLevel =
                (client.risk_score ?? 0) >= 70
                  ? 'High'
                  : (client.risk_score ?? 0) >= 40
                    ? 'Medium'
                    : 'Low'
              const riskColor =
                riskLevel === 'High'
                  ? 'text-red-600 bg-red-50'
                  : riskLevel === 'Medium'
                    ? 'text-yellow-700 bg-yellow-50'
                    : 'text-green-600 bg-green-50'

              return (
                <div
                  key={client.name}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {client.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Outstanding: {formatINR(client.total_outstanding ?? 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${riskColor}`}
                    >
                      {riskLevel} Risk
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Score: {client.risk_score ?? 0}/100
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
