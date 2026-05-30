'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { handleLinkPhone } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Linking...' : 'Link'}
    </button>
  )
}

export function PhoneLinkForm() {
  const [state, formAction] = useFormState(handleLinkPhone, undefined)

  return (
    <div>
      <form action={formAction} className="flex gap-2">
        <input
          type="tel"
          name="phone"
          placeholder="+91 98765 43210"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <SubmitButton />
      </form>
      {state?.error && (
        <p className="mt-2 text-sm text-red-600">{state.error}</p>
      )}
    </div>
  )
}
