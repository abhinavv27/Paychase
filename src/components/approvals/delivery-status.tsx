'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, MessageSquare, Send, ChevronRight } from 'lucide-react'

interface DeliveryStatusProps {
  draftId: string
  initialStatus?: 'draft' | 'sent' | 'delivered' | 'responded'
}

const statusSteps = [
  { key: 'sent', label: 'Sent', icon: Send, color: 'text-blue-600 bg-blue-50' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  { key: 'responded', label: 'Replied', icon: MessageSquare, color: 'text-purple-600 bg-purple-50' },
] as const

async function updateDeliveryStatus(draftId: string, status: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/approvals/${draftId}/delivery`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    return await res.json()
  } catch {
    return { error: 'Failed to update status' }
  }
}

export function DeliveryStatus({ draftId, initialStatus = 'draft' }: DeliveryStatusProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()
  const currentStep = statusSteps.findIndex((s) => s.key === status)

  const handleAdvance = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateDeliveryStatus(draftId, newStatus)
      if (result.success) setStatus(newStatus as typeof status)
    })
  }

  if (status === 'draft') {
    return null
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2">
        {statusSteps.map((step, idx) => {
          const isCurrent = idx === currentStep
          const isNext = idx === currentStep + 1
          const isPast = idx < currentStep
          const isClickable = isNext && !isPending

          return (
            <div key={step.key} className="flex items-center">
              {isClickable ? (
                <button
                  onClick={() => handleAdvance(step.key)}
                  disabled={isPending}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                >
                  <step.icon className="w-3 h-3" />
                  {step.label}
                  <ChevronRight className="w-3 h-3" />
                </button>
              ) : (
                <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                  isPast || isCurrent ? step.color : 'text-gray-300'
                }`}>
                  <step.icon className="w-3 h-3" />
                  {step.label}
                </span>
              )}
              {idx < statusSteps.length - 1 && (
                <div className={`w-4 h-0.5 mx-1 ${isPast ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
