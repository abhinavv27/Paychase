'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClientAction } from '@/lib/clients-actions'
import type { Database } from '@/lib/supabase/types'

type ClientInsert = Database['public']['Tables']['clients']['Insert']

interface ClientFormProps {
  initialData?: Partial<ClientInsert>
  mode?: 'add' | 'edit'
}

const INDUSTRIES = ['Technology', 'Marketing', 'Design', 'Consulting', 'Other']

export function ClientForm({ initialData, mode = 'add' }: ClientFormProps) {
  const router = useRouter()
  const [consentChecked, setConsentChecked] = useState(false)

  const [state, formAction, isPending] = useFormState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      if (!consentChecked) {
        return { error: 'You must confirm client consent to proceed' }
      }
      return createClientAction(formData)
    },
    undefined
  )

  return (
    <form action={formAction} className="space-y-6 max-w-lg">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initialData?.name ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
          placeholder="Client name"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Phone
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
            +91
          </span>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initialData?.phone ?? ''}
            className="block w-full rounded-r-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
            placeholder="9876543210"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={initialData?.email ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
          placeholder="client@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="industry"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Industry
        </label>
        <select
          id="industry"
          name="industry"
          defaultValue={initialData?.industry ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
        >
          <option value="">Select industry</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start gap-3">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          checked={consentChecked}
          onChange={(e) => setConsentChecked(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label
          htmlFor="consent"
          className="text-sm text-gray-700 dark:text-gray-300"
        >
          I confirm this client has consented to receive payment reminders
          <span className="text-red-500">*</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? mode === 'edit'
              ? 'Saving...'
              : 'Adding...'
            : mode === 'edit'
              ? 'Save Changes'
              : 'Add Client'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
