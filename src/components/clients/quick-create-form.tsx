'use client'

import { useEffect } from 'react'
import { useFormState } from 'react-dom'
import { quickCreateClientAction } from '@/lib/clients-actions'

export function QuickCreateForm({ onCreated }: { onCreated?: (client: { id: string; name: string }) => void }) {
  const [state, action] = useFormState(quickCreateClientAction, {})

  useEffect(() => {
    if (state?.id && state?.name && onCreated) {
      onCreated({ id: state.id, name: state.name })
    }
  }, [state?.id, state?.name, onCreated])

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Client Name *</label>
        <input id="name" name="name" required className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
        <input id="phone" name="phone" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input id="email" name="email" type="email" className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600" />
      </div>
      <label htmlFor="consent" className="flex items-center gap-2 text-sm text-gray-600">
        <input id="consent" type="checkbox" name="consent" required />
        I have obtained consent to send payment reminders
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.id && onCreated && <p className="text-sm text-green-600">Client created!</p>}
      <button type="submit" className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
        {state?.id ? 'Done' : 'Add Client'}
      </button>
    </form>
  )
}
