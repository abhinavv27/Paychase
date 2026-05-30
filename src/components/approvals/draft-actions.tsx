'use client'

import { useFormState } from 'react-dom'
import { useState, useEffect, useRef } from 'react'
import { approveDraft, dismissDraft } from '@/lib/approvals/actions'
import { createClient } from '@/lib/supabase/client'
import { copyToClipboard } from '@/lib/whatsapp/deep-link'
import toast from 'react-hot-toast'
import { Check, X, Loader2, ExternalLink, SendHorizonal } from 'lucide-react'

async function markAsSent(draftId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('reminders')
    .update({ status: 'sent', approval_status: 'sent' })
    .eq('id', draftId)
  if (error) return { error: error.message }
  return { success: true }
}

export function ApproveButton({ draftId }: { draftId: string }) {
  const [state, formAction] = useFormState(
    async (_prev: unknown) => {
      const result = await approveDraft(draftId)
      return result
    },
    undefined
  )
  const [isPending, setPending] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [sending, setSending] = useState(false)
  const redirectFired = useRef(false)

  useEffect(() => {
    if (state?.deepLink && !redirectFired.current) {
      redirectFired.current = true

      const messageText = extractMessageFromDeepLink(state.deepLink)
      copyToClipboard(messageText).then((ok) => {
        if (ok) toast.success('Message copied to clipboard as backup')
        else toast('Tap to copy message', { icon: '📋' })
      })

      setTimeout(() => {
        window.location.href = state.deepLink!
      }, 300)
    }
  }, [state?.deepLink])

  if (confirmed) {
    return (
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          <SendHorizonal className="w-4 h-4 text-blue-600" />
          <p className="text-sm text-blue-700 font-medium">Marked as sent</p>
        </div>
      </div>
    )
  }

  if (state?.deepLink) {
    return (
      <div className="mt-2 space-y-2">
        <p className="text-xs text-gray-500">WhatsApp should be open with your message. Did you send it?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              setSending(true)
              const result = await markAsSent(draftId)
              setSending(false)
              if (result.success) {
                setConfirmed(true)
                toast.success('Marked as sent')
              } else {
                toast.error(result.error || 'Failed to update')
              }
            }}
            disabled={sending}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            I sent it
          </button>
          <a
            href={state.deepLink}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
          >
            <ExternalLink className="w-4 h-4" /> Open WhatsApp
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <form
        action={formAction}
        onSubmit={() => setPending(true)}
      >
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
          ) : (
            <><Check className="w-4 h-4" /> Approve & Send via WhatsApp</>
          )}
        </button>
      </form>
      {state?.error && <p className="text-red-600 text-xs mt-2">{state.error}</p>}
    </div>
  )
}

function extractMessageFromDeepLink(link: string): string {
  try {
    const parsed = new URL(link)
    const text = parsed.searchParams.get('text')
    return text ? decodeURIComponent(text) : ''
  } catch {
    return ''
  }
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
