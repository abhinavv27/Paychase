import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Inbox } from "lucide-react"

export const revalidate = 300
import { ApproveButton, DismissButton } from "@/components/approvals/draft-actions"
import { DeliveryStatus } from "@/components/approvals/delivery-status"
import { EmptyState } from "@/components/ui/empty-state"

export const metadata: Metadata = {
  title: "Approvals",
}

export default async function ApprovalsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: drafts } = await supabase
    .from("reminders")
    .select("*, clients(name, company_name), invoices(amount, invoice_number)")
    .eq("user_id", user.id)
    .eq("approval_status", "draft")
    .order("created_at", { ascending: false })

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link href="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Draft Approvals</h1>
        <p className="text-gray-500 mt-1">
          {drafts?.length || 0} draft{drafts?.length !== 1 ? "s" : ""} awaiting your review
        </p>
      </div>

      {!drafts?.length ? (
        <EmptyState icon={Inbox} title="No pending drafts" description="New drafts will appear here when AI generates them." />
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div key={draft.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{draft.clients?.name || "Unknown Client"}</p>
                  <p className="text-sm text-gray-500">
                    {draft.clients?.company_name} &middot; Invoice #{draft.invoices?.invoice_number}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    ₹{Number(draft.invoices?.amount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  draft.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {draft.status}
                </span>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700 italic">
                &ldquo;{draft.message_text}&rdquo;
              </div>
              {draft.scheduled_send_at && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  Scheduled for{' '}
                  {new Date(draft.scheduled_send_at).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
              <DeliveryStatus
                draftId={draft.id}
                initialStatus={draft.status as 'draft' | 'sent' | 'delivered' | 'responded'}
              />
              <div className="mt-3 flex gap-2">
                <ApproveButton draftId={draft.id} />
                <DismissButton draftId={draft.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
