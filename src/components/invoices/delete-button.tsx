'use client'

import { useFormState } from 'react-dom'
import { deleteInvoiceAction } from '@/lib/invoices-actions'

export function DeleteInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction] = useFormState(
    async (_prev: unknown) => {
      return await deleteInvoiceAction(invoiceId)
    },
    undefined
  )

  return (
    <div className="inline">
      <form action={formAction} className="inline" onSubmit={(e) => {
        if (!confirm('Are you sure you want to delete this invoice?')) {
          e.preventDefault()
        }
      }}>
        <button type="submit" className="text-red-600 hover:text-red-800">
          Delete
        </button>
      </form>
      {state?.error && <p className="text-red-600 text-xs mt-1">{state.error}</p>}
    </div>
  )
}
