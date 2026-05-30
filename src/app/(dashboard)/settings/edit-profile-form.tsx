'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updateProfileAction } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving...' : 'Save'}
    </button>
  )
}

export function EditProfileForm({
  name,
  companyName,
}: {
  name: string | null
  companyName: string | null
}) {
  const [state, formAction] = useFormState(updateProfileAction, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={name || ''}
          required
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
          Company
        </label>
        <input
          id="company_name"
          name="company_name"
          type="text"
          defaultValue={companyName || ''}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-sm text-green-600">Profile updated.</p>
      )}
      <SubmitButton />
    </form>
  )
}
