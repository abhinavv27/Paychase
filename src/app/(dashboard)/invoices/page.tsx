import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/invoices/status-badge'
import { DeleteInvoiceButton } from '@/components/invoices/delete-button'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/types'

export const metadata: Metadata = {
  title: 'Invoices',
}

type InvoiceWithClient = Database['public']['Tables']['invoices']['Row'] & {
  client: { name: string } | null
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

  // Count queries for each status (fast head-only queries)
  const [allCount, pendingCount, paidCount, overdueCount] = await Promise.all([
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'pending').eq('user_id', user.id),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'paid').eq('user_id', user.id),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'pending').lt('due_date', today).eq('user_id', user.id),
  ])

  const totalCount = allCount.count || 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Data query with pagination and optional filter
  let query = supabase
    .from('invoices')
    .select('*, client:clients(name)')
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

  // Build filter URLs
  const filterLink = (status: string) => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    const qs = params.toString()
    return `/invoices${qs ? `?${qs}` : ''}`
  }

  const prevPage = currentPage > 1 ? currentPage - 1 : null
  const nextPage = currentPage < totalPages ? currentPage + 1 : null

  const prevLink = prevPage ? `/invoices?status=${statusFilter}&page=${prevPage}` : null
  const nextLink = nextPage ? `/invoices?status=${statusFilter}&page=${nextPage}` : null

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Filters + Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Link
              href={filterLink('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({allCount.count || 0})
            </Link>
            <Link
              href={filterLink('pending')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Pending ({pendingCount.count || 0})
            </Link>
            <Link
              href={filterLink('paid')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'paid'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Paid ({paidCount.count || 0})
            </Link>
            <Link
              href={filterLink('overdue')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'overdue'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Overdue ({overdueCount.count || 0})
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {typedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                typedInvoices.map((invoice) => {
                  const isOverdue = invoice.status === 'pending' && new Date(invoice.due_date) < new Date(today)
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {invoice.client?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{invoice.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.issue_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.due_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={isOverdue ? 'overdue' : invoice.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          href={`/invoices/${invoice.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Edit
                        </Link>
                        <DeleteInvoiceButton invoiceId={invoice.id} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              {prevLink ? (
                <Link href={prevLink} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                  Previous
                </Link>
              ) : (
                <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">
                  Previous
                </span>
              )}
              {nextLink ? (
                <Link href={nextLink} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                  Next
                </Link>
              ) : (
                <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">
                  Next
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
