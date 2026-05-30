import { ClientForm } from '@/components/clients/client-form'

export default function AddClientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add Client
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add a new client to your account. All clients must have consent to
          receive payment reminders.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <ClientForm mode="add" />
      </div>
    </div>
  )
}
