import Link from 'next/link'
import { CheckCircle, Inbox } from 'lucide-react'

export function ActionBanner({ draftCount }: { draftCount: number }) {
  if (draftCount === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">All caught up!</h3>
            <p className="text-sm text-green-700">No messages to review. AI will draft follow-ups for overdue invoices.</p>
          </div>
        </div>
      </div>
    )
  }

  const urgency = draftCount >= 6 ? 'red' : 'yellow'
  const bgColor = urgency === 'red' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
  const textColor = urgency === 'red' ? 'text-red-900' : 'text-yellow-900'
  const subtextColor = urgency === 'red' ? 'text-red-700' : 'text-yellow-700'
  const iconColor = urgency === 'red' ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100'
  const message = urgency === 'red'
    ? `${draftCount} messages waiting — don't let payments slip!`
    : `${draftCount} message${draftCount > 1 ? 's' : ''} ready to review`

  return (
    <div className={`rounded-xl border ${bgColor} p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${iconColor}`}>
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <h3 className={`font-semibold ${textColor}`}>{message}</h3>
            <p className={`text-sm ${subtextColor}`}>Review AI-drafted follow-ups and send from your WhatsApp.</p>
          </div>
        </div>
        <Link
          href="/approvals"
          className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white ${urgency === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
        >
          Review Now &rarr;
        </Link>
      </div>
    </div>
  )
}
