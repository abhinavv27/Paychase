'use client'

import { useState, useTransition } from 'react'
import { CheckSquare, Send, DollarSign } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onMarkPaid: () => Promise<void>
  onGenerateDrafts: () => Promise<void>
  onClear: () => void
}

export function BulkActionBar({ selectedCount, onMarkPaid, onGenerateDrafts, onClear }: BulkActionBarProps) {
  const [isPending, startTransition] = useTransition()
  const [action, setAction] = useState('')

  const handleAction = async (fn: () => Promise<void>, label: string) => {
    setAction(label)
    startTransition(async () => {
      await fn()
      setAction('')
    })
  }

  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4">
        <span className="flex items-center gap-2 text-sm font-medium">
          <CheckSquare className="w-4 h-4" />
          {selectedCount} selected
        </span>
        <div className="w-px h-5 bg-gray-600" />
        <button
          onClick={() => handleAction(onMarkPaid, 'marking paid')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <DollarSign className="w-4 h-4" />
          {isPending && action === 'marking paid' ? 'Marking...' : 'Mark Paid'}
        </button>
        <button
          onClick={() => handleAction(onGenerateDrafts, 'generating')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
          {isPending && action === 'generating' ? 'Generating...' : 'Generate Drafts'}
        </button>
        <div className="w-px h-5 bg-gray-600" />
        <button
          onClick={onClear}
          disabled={isPending}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
