'use client'

import { useState } from 'react'
import { generateWhatsAppLink, formatPhoneForWhatsApp } from '@/lib/whatsapp'

interface DraftCardProps {
  id: string
  clientName: string
  clientPhone: string | null
  invoiceNumber: string
  amount: number
  daysOverdue: number
  escalationLevel: string
  messageText: string
  upiLink?: string
  onApprove: (id: string) => void
  onDismiss: (id: string) => void
  onEdit: (id: string, newText: string) => void
}

export function DraftCard({
  id,
  clientName,
  clientPhone,
  invoiceNumber,
  amount,
  daysOverdue,
  escalationLevel,
  messageText,
  upiLink,
  onApprove,
  onDismiss,
  onEdit,
}: DraftCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(messageText)

  const escalationColors: Record<string, string> = {
    gentle: 'bg-green-100 text-green-800',
    firm: 'bg-yellow-100 text-yellow-800',
    urgent: 'bg-red-100 text-red-800',
  }

  const handleSend = () => {
    if (!clientPhone) return
    const phone = formatPhoneForWhatsApp(clientPhone)
    const link = generateWhatsAppLink({ phone, message: editedText })
    window.open(link, '_blank')
    onApprove(id)
  }

  const handleSaveEdit = () => {
    onEdit(id, editedText)
    setIsEditing(false)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{clientName}</h3>
          <p className="text-sm text-gray-500">
            Invoice {invoiceNumber} · ₹{amount.toLocaleString('en-IN')} · {daysOverdue} days overdue
          </p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${escalationColors[escalationLevel] || 'bg-gray-100 text-gray-800'}`}>
          {escalationLevel}
        </span>
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-4">
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={4}
          />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{editedText}</p>
        )}
      </div>

      {upiLink && (
        <div className="mt-2 text-xs text-gray-500">
          UPI link included in message
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => { setIsEditing(false); setEditedText(messageText) }}
              className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={handleSend}
              disabled={!clientPhone}
              className="inline-flex items-center px-3 py-1.5 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send via WhatsApp
            </button>
            <button
              onClick={() => onDismiss(id)}
              className="inline-flex items-center px-3 py-1.5 rounded-md border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50"
            >
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  )
}
