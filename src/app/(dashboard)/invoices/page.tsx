import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { calculatePaymentProbability } from '@/lib/ai/payment-probability'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/types'
import { InvoiceTableShell } from './invoice-table-shell'

export const metadata: Metadata = {
  title: 'Invoices',
}

type InvoiceWithClient = Database['public']['Tables']['invoices']['Row'] & {
  client: { name: string; on_time_rate: number; avg_payment_delay_days: number } | null
}

const PAGE_SIZE = 20

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-8 text-center text-gray-500">You must be logged in to view invoices.</div>
  }

  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1)
  const statusFilter = searchParams.status || 'all'
  const today = new Date().toISOString().split('T')[0]

  const [allCount, pendingCount, paidCount, overdueCount] = await Promise.all([
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('user_id', user.id),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'paid').eq('user_id', user.id),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'pending').lt('due_date', today).eq('user_id', user.id),
  ])

  const totalCount = allCount.count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  let query = supabase
    .from('invoices')
    .select('*, client:clients(name, on_time_rate, avg_payment_delay_days)')
    .eq('user_id', user.id)

  if (statusFilter === 'overdue') {
    query = query.eq('status', 'pending').lt('due_date', today)
  } else if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: invoices } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  const typedInvoices = (invoices || []) as InvoiceWithClient[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all your invoices
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/invoices/import"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition-colors"
          >
            Import CSV
          </Link>
          <Link
            href="/invoices/create"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            Create Invoice
          </Link>
        </div>
      </div>

      <InvoiceTableShell
        invoices={typedInvoices.map((invoice) => {
          const isOverdue = invoice.status === 'pending' && new Date(invoice.due_date) < new Date(today)
          const daysOverdue = isOverdue
            ? Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))
            : 0
          const prob = invoice.client
            ? calculatePaymentProbability({
                daysOverdue,
                clientOnTimeRate: invoice.client.on_time_rate ?? 0,
                clientAvgDelayDays: invoice.client.avg_payment_delay_days ?? 0,
              })
            : null
          return { ...invoice, isOverdue, probability: prob }
        })}
        statusFilter={statusFilter}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={allCount.count ?? 0}
        pendingCount={pendingCount.count ?? 0}
        paidCount={paidCount.count ?? 0}
        overdueCount={overdueCount.count ?? 0}
      />
    </div>
  )
}
