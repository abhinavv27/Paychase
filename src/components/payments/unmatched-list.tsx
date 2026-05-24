'use client'

import { useState } from 'react'
import type { PaymentTransaction } from '@/lib/payments/reconciliation'
import { matchPayment } from '@/lib/payments/reconciliation'
import { useRouter } from 'next/navigation'

export function UnmatchedList({ payments }: { payments: PaymentTransaction[] }) {
  const [selectedInvoice, setSelectedInvoice] = useState<Record<string, string>>({})
  const router = useRouter()

  const handleMatch = async (txId: string) => {
    const invoiceId = selectedInvoice[txId]
    if (!invoiceId) return
    const result = await matchPayment(txId, invoiceId)
    if (result.success) router.refresh()
  }

  return (
    <div className="space-y-3">
      {payments.map((tx) => (
        <div key={tx.id} className="bg-white rounded-xl border border-yellow-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">₹{tx.amount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 font-mono">{tx.razorpay_payment_id}</p>
            </div>
            <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Unmatched</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={selectedInvoice[tx.id] || ''}
              onChange={(e) => setSelectedInvoice((prev) => ({ ...prev, [tx.id]: e.target.value }))}
              placeholder="Invoice ID to match"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleMatch(tx.id)}
              disabled={!selectedInvoice[tx.id]}
              className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Match
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
