'use client'

import { useFormState } from 'react-dom'
import { regenerateInvoicePaymentLinkAction } from '@/lib/invoices-actions'

export function RegeneratePaymentLinkButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction] = useFormState(
    async (_prev: unknown) => {
      return await regenerateInvoicePaymentLinkAction(invoiceId)
    },
    undefined
  )

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Regenerate Payment Link
        </button>
      </form>
      {state?.url && (
        <p className="text-green-600 text-xs mt-1">
          Payment link: <a href={state.url} target="_blank" rel="noopener noreferrer" className="underline">{state.url}</a>
        </p>
      )}
      {state?.error && <p className="text-red-600 text-xs mt-1">{state.error}</p>}
    </div>
  )
}
