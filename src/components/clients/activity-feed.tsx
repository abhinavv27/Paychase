'use client'

import { useEffect, useState } from 'react'
import { Send, CheckCircle, MessageSquare, DollarSign, FileText, Loader2 } from 'lucide-react'

interface ActivityEvent {
  id: string
  event_type: string
  event_data: Record<string, unknown>
  created_at: string
}

const eventConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  invoice_sent: { icon: Send, label: 'Invoice sent', color: 'text-blue-600 bg-blue-50' },
  invoice_paid: { icon: DollarSign, label: 'Invoice paid', color: 'text-green-600 bg-green-50' },
  reminder_sent: { icon: Send, label: 'Reminder sent', color: 'text-indigo-600 bg-indigo-50' },
  reminder_delivered: { icon: CheckCircle, label: 'Reminder delivered', color: 'text-green-600 bg-green-50' },
  reminder_responded: { icon: MessageSquare, label: 'Client replied', color: 'text-purple-600 bg-purple-50' },
  note_added: { icon: FileText, label: 'Note added', color: 'text-gray-600 bg-gray-50' },
}

export function ActivityFeed({ clientId }: { clientId: string }) {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/events`)
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>

  if (events.length === 0) return <p className="text-sm text-gray-400 text-center py-8">No activity yet</p>

  return (
    <div className="space-y-0">
      {events.map((event) => {
        const config = eventConfig[event.event_type] || { icon: FileText, label: event.event_type, color: 'text-gray-600 bg-gray-50' }
        const Icon = config.icon
        return (
          <div key={event.id} className="flex gap-3 py-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.color.split(' ')[1]}`}>
              <Icon className={`w-4 h-4 ${config.color.split(' ')[0]}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{config.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(event.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
