import type { Metadata } from 'next'
import { getReconciliationData } from '@/lib/payments/reconciliation'
import { UnmatchedList } from '@/components/payments/unmatched-list'
import { CheckCircle, Clock } from 'lucide-react'

export const metadata: Metadata = { title: 'Reconciliation' }

export default async function ReconciliationPage() {
  const { matched, unmatched } = await getReconciliationData()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Reconciliation</h1>
        <p className="text-sm text-gray-500 mt-1">Match Razorpay payments to invoices</p>
      </div>

      {unmatched.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" /> Unmatched Payments
          </h2>
          <UnmatchedList payments={unmatched} />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" /> Recently Matched
        </h2>
        {matched.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No matched payments yet</p>
        ) : (
          <div className="space-y-2">
            {matched.map((tx) => (
              <div key={tx.id} className="bg-white rounded-lg border border-gray-200 p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">₹{tx.amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500">{tx.razorpay_payment_id}</p>
                </div>
                <span className="text-xs text-green-600 font-medium">Matched</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
