'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, MessageSquare, Send } from 'lucide-react'

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

  const handleMark = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateDeliveryStatus(draftId, newStatus)
      if (result.success) setStatus(newStatus as typeof status)
    })
  }

  if (status === 'draft') {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-2">After sending, mark the status:</p>
        <div className="flex gap-2">
          {statusSteps.map((step) => (
            <button
              key={step.key}
              onClick={() => handleMark(step.key)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <step.icon className="w-3.5 h-3.5" />
              Mark {step.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2">
        {statusSteps.map((step, idx) => (
          <div key={step.key} className="flex items-center">
            <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
              idx <= currentStep ? step.color : 'text-gray-400 bg-gray-50'
            }`}>
              <step.icon className="w-3 h-3" />
              {step.label}
            </span>
            {idx < statusSteps.length - 1 && (
              <div className={`w-4 h-0.5 mx-1 ${idx < currentStep ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
