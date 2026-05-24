'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/components/invoices/status-badge'
import { DeleteInvoiceButton } from '@/components/invoices/delete-button'
import { ProbabilityBadge } from '@/components/invoices/probability-badge'
import { BulkActionBar } from '@/components/invoices/bulk-action-bar'
import { batchMarkAsPaid, batchGenerateDrafts } from '@/lib/invoices/bulk-actions'
import { FileText, Plus } from 'lucide-react'

interface InvoiceRow {
  id: string
  invoice_number: string
  amount: number
  issue_date: string
  due_date: string
  status: string
  client: { name: string; on_time_rate: number; avg_payment_delay_days: number } | null
  probability: { probability7: number; probability30: number; probability60: number } | null
  isOverdue: boolean
}

export function InvoiceTableShell({
  invoices,
  statusFilter,
  currentPage,
  totalPages,
  totalCount,
  pendingCount,
  paidCount,
  overdueCount,
}: {
  invoices: InvoiceRow[]
  statusFilter: string
  currentPage: number
  totalPages: number
  totalCount: number
  pendingCount: number
  paidCount: number
  overdueCount: number
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const filterLink = (status: string) => {
    const params = new URLSearchParams()
    if (status !== 'all') params.set('status', status)
    const qs = params.toString()
    return `/invoices${qs ? `?${qs}` : ''}`
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Link href={filterLink('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              All ({totalCount})
            </Link>
            <Link href={filterLink('pending')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'pending' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              Pending ({pendingCount})
            </Link>
            <Link href={filterLink('paid')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'paid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              Paid ({paidCount})
            </Link>
            <Link href={filterLink('overdue')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'overdue' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              Overdue ({overdueCount})
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === invoices.length && invoices.length > 0}
                    onChange={() => {
                      if (selectedIds.length === invoices.length) setSelectedIds([])
                      else setSelectedIds(invoices.map((i) => i.id))
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Prob.</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-sm font-medium text-gray-900">No invoices yet</h3>
                      <p className="text-sm text-gray-500 mt-1">Get started by creating your first invoice.</p>
                      <Link href="/invoices/create" className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                        <Plus className="w-4 h-4" />
                        Create Invoice
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(invoice.id)}
                        onChange={() => {
                          setSelectedIds((prev) =>
                            prev.includes(invoice.id)
                              ? prev.filter((id) => id !== invoice.id)
                              : [...prev, invoice.id]
                          )
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.client?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₹{invoice.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.issue_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.due_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={invoice.isOverdue ? 'overdue' : invoice.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.probability ? (
                        <div className="flex gap-1">
                          <ProbabilityBadge probability={invoice.probability.probability7} label="7d" />
                          <ProbabilityBadge probability={invoice.probability.probability30} label="30d" />
                          <ProbabilityBadge probability={invoice.probability.probability60} label="60d" />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link href={`/invoices/${invoice.id}/edit`} className="text-blue-600 hover:text-blue-800 mr-3">Edit</Link>
                      <DeleteInvoiceButton invoiceId={invoice.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link href={`/invoices?status=${statusFilter}&page=${currentPage - 1}`} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Previous</Link>
              ) : (
                <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">Previous</span>
              )}
              {currentPage < totalPages ? (
                <Link href={`/invoices?status=${statusFilter}&page=${currentPage + 1}`} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Next</Link>
              ) : (
                <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">Next</span>
              )}
            </div>
          </div>
        )}
      </div>

      <BulkActionBar
        selectedCount={selectedIds.length}
        onMarkPaid={async () => {
          await batchMarkAsPaid(selectedIds)
          setSelectedIds([])
        }}
        onGenerateDrafts={async () => {
          await batchGenerateDrafts(selectedIds)
          setSelectedIds([])
        }}
        onClear={() => setSelectedIds([])}
      />
    </>
  )
}
