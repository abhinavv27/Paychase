interface ReminderEvent {
  id: string
  sent_at: string | null
  delivered_at: string | null
  responded_at: string | null
  status: string
  message_text: string | null
  channel: string
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'sent': case 'delivered': return 'bg-blue-100 text-blue-600'
    case 'responded': case 'paid': return 'bg-green-100 text-green-600'
    case 'failed': case 'bounced': return 'bg-red-100 text-red-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'sent': return '→'
    case 'delivered': return '✓'
    case 'responded': return '↩'
    case 'paid': return '₹'
    case 'failed': return '✕'
    default: return '•'
  }
}

export function ResponseTimeline({ reminders }: { reminders: ReminderEvent[] }) {
  if (reminders.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        No communication history yet.
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {reminders.map((reminder, idx) => (
          <li key={reminder.id}>
            <div className="relative pb-8">
              {idx < reminders.length - 1 && (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              )}
              <div className="relative flex gap-4">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white text-sm font-medium ${getStatusColor(reminder.status)}`}>
                  {getStatusIcon(reminder.status)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">
                    {reminder.message_text
                      ? reminder.message_text.length > 120
                        ? reminder.message_text.slice(0, 120) + '...'
                        : reminder.message_text
                      : 'No message preview'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {reminder.sent_at && `Sent ${new Date(reminder.sent_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    {reminder.delivered_at && ` · Delivered ${new Date(reminder.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                    {reminder.responded_at && ` · Responded ${new Date(reminder.responded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{reminder.channel}</p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
