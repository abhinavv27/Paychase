import { createClient } from '@/lib/supabase/server'
import { DraftCard } from '@/components/approvals/draft-card'
import { approveDraft, dismissDraft, editDraft } from '@/lib/approvals/actions'
import { CheckCircle } from 'lucide-react'

async function getDraftReminders() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('reminders')
    .select(`
      id,
      message_text,
      approval_status,
      created_at,
      invoices (
        invoice_number,
        amount,
        due_date,
        upi_link
      ),
      clients (
        name,
        phone
      )
    `)
    .eq('user_id', user.id)
    .eq('approval_status', 'draft')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching draft reminders:', error)
    return []
  }

  return data || []
}

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  const diffMs = now.getTime() - due.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function getEscalationLevel(daysOverdue: number): string {
  if (daysOverdue <= 7) return 'gentle'
  if (daysOverdue <= 30) return 'firm'
  return 'urgent'
}

export default async function ApprovalsPage() {
  const drafts = await getDraftReminders()

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <CheckCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">No messages to review</h2>
        <p className="mt-2 text-sm text-gray-500">
          AI will draft follow-ups for overdue invoices.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">
          {drafts.length} message{drafts.length !== 1 ? 's' : ''} ready to review
        </p>
      </div>

      <div className="space-y-4">
        {drafts.map((draft) => {
          const invoices = draft.invoices as { invoice_number: string; amount: number; due_date: string; upi_link: string | null }[] | null
          const clients = draft.clients as { name: string; phone: string | null }[] | null
          const invoice = invoices?.[0] ?? null
          const client = clients?.[0] ?? null
          const daysOverdue = invoice ? getDaysOverdue(invoice.due_date) : 0

          return (
            <DraftCard
              key={draft.id}
              id={draft.id}
              clientName={client?.name || 'Unknown Client'}
              clientPhone={client?.phone || null}
              invoiceNumber={invoice?.invoice_number || 'N/A'}
              amount={invoice?.amount || 0}
              daysOverdue={daysOverdue}
              escalationLevel={getEscalationLevel(daysOverdue)}
              messageText={draft.message_text}
              upiLink={invoice?.upi_link || undefined}
              onApprove={approveDraft}
              onDismiss={dismissDraft}
              onEdit={editDraft}
            />
          )
        })}
      </div>
    </div>
  )
}
