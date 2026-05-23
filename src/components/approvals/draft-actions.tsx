'use client'

import { useFormState } from 'react-dom'
import { useState } from 'react'
import { approveDraft, dismissDraft } from '@/lib/approvals/actions'
import { Check, X, Loader2 } from 'lucide-react'

export function ApproveButton({ draftId }: { draftId: string }) {
  const [state, formAction] = useFormState(
    async (_prev: unknown) => await approveDraft(draftId),
    undefined
  )
  const [isPending, setPending] = useState(false)

  return (
    <div>
      <form
        action={formAction}
        onSubmit={() => setPending(true)}
      >
        <button
          type="submit"
          disabled={isPending || !!state?.deepLink}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors ${
            isPending
              ? 'bg-green-400 text-white cursor-not-allowed'
              : state?.deepLink
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
          ) : (
            <><Check className="w-4 h-4" /> Approve & Send via WhatsApp</>
          )}
        </button>
      </form>
      {state?.error && <p className="text-red-600 text-xs mt-2">{state.error}</p>}
      {state?.deepLink && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">Draft approved!</p>
          <p className="text-xs text-green-600 mt-1">Open WhatsApp to send this message:</p>
          <div className="mt-2 flex gap-2">
            <a
              href={state.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              Open WhatsApp
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(state.deepLink)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DismissButton({ draftId }: { draftId: string }) {
  const [state, formAction] = useFormState(
    async (_prev: unknown) => await dismissDraft(draftId),
    undefined
  )
  const [isPending, setPending] = useState(false)

  return (
    <div>
      <form
        action={formAction}
        onSubmit={() => setPending(true)}
      >
        <button
          type="submit"
          disabled={isPending}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm transition-colors ${
            isPending
              ? 'border border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Dismissing...</>
          ) : (
            <><X className="w-4 h-4" /> Dismiss</>
          )}
        </button>
      </form>
      {state?.error && <p className="text-red-600 text-xs mt-2">{state.error}</p>}
      {state?.success && <p className="text-green-600 text-xs mt-2">Dismissed</p>}
    </div>
  )
}
