import { getInvoices, getOverdueInvoices } from '@/lib/invoices'
import { StatusBadge } from '@/components/invoices/status-badge'
import Link from 'next/link'

export default async function InvoicesPage() {
  const [invoices, overdueInvoices] = await Promise.all([
    getInvoices(),
    getOverdueInvoices(),
  ])

  const overdueIds = new Set(overdueInvoices.map((inv) => inv.id))

  const sortedInvoices = [...invoices].sort((a, b) => {
    const aOverdue = overdueIds.has(a.id) ? 1 : 0
    const bOverdue = overdueIds.has(b.id) ? 1 : 0
    if (aOverdue !== bOverdue) return bOverdue - aOverdue
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-sm font-medium">
              All ({invoices.length})
            </button>
            <button className="px-3 py-1.5 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-100">
              Pending ({invoices.filter((inv) => inv.status === 'pending').length})
            </button>
            <button className="px-3 py-1.5 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-100">
              Paid ({invoices.filter((inv) => inv.status === 'paid').length})
            </button>
            <button className="px-3 py-1.5 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-100">
              Overdue ({overdueInvoices.length})
            </button>
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
              {sortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No invoices found. Create your first invoice to get started.
                  </td>
                </tr>
              ) : (
                sortedInvoices.map((invoice) => {
                  const displayStatus = overdueIds.has(invoice.id)
                    ? 'overdue'
                    : invoice.status
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {(invoice as any).client?.name || 'Unknown'}
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
                        <StatusBadge status={displayStatus} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          href={`/invoices/${invoice.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Edit
                        </Link>
                        <button className="text-red-600 hover:text-red-800">
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
