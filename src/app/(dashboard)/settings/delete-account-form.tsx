'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { deleteAccountAction } from './actions'
import { useState } from 'react'

function DeleteButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-red-600 px-4 py-2 text-white font-medium text-sm hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Deleting...' : 'Delete My Account'}
    </button>
  )
}

export function DeleteAccountForm() {
  const [state, formAction] = useFormState(deleteAccountAction, undefined)
  const [confirmed, setConfirmed] = useState(false)

  if (!confirmed) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setConfirmed(true)}
          className="rounded-lg bg-red-600 px-4 py-2 text-white font-medium text-sm hover:bg-red-700 transition-colors"
        >
          Delete My Account
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-sm text-red-700 font-medium">Are you sure?</p>
        <p className="text-xs text-red-600 mt-1">
          This will permanently delete all your data and your account. This action cannot be undone.
        </p>
      </div>
      <form action={formAction} className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmed(false)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <DeleteButton />
      </form>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </div>
  )
}
