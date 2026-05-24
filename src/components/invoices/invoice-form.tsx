'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createInvoiceAction, updateInvoiceAction } from '@/lib/invoices-actions'
import { QuickCreateForm } from '@/components/clients/quick-create-form'
import type { Database } from '@/lib/supabase/types'

type InvoiceRow = Database['public']['Tables']['invoices']['Row']

interface InvoiceFormProps {
  clients: { id: string; name: string }[]
  initialData?: InvoiceRow | null
  nextInvoiceNumber?: string
}

const initialState = { success: false, error: undefined as string | undefined }

export function InvoiceForm({ clients, initialData, nextInvoiceNumber }: InvoiceFormProps) {
  const router = useRouter()
  const action = initialData
    ? updateInvoiceAction.bind(null, initialData.id)
    : createInvoiceAction

  const [state, formAction, isPending] = useFormState(action, initialState)
  const [localClients, setLocalClients] = useState(clients)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState(initialData?.client_id || '')

  const handleQuickCreated = (client: { id: string; name: string }) => {
    setLocalClients(prev => [...prev, client])
    setSelectedClientId(client.id)
    setShowQuickCreate(false)
  }

  return (
    <>
      <form action={formAction} className="space-y-6">
        {state?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {state.error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
              Client <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                id="client_id"
                name="client_id"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a client</option>
                {localClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowQuickCreate(true)}
                className="mt-1 inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                + New Client
              </button>
            </div>
          </div>

        <div>
          <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700">
            Invoice Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="invoice_number"
            name="invoice_number"
            defaultValue={initialData?.invoice_number || nextInvoiceNumber || ''}
            required
            placeholder="INV-001"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount (INR) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            defaultValue={initialData?.amount?.toString() || ''}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700">
            Issue Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="issue_date"
            name="issue_date"
            defaultValue={initialData?.issue_date || new Date().toISOString().split('T')[0]}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
            Due Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="due_date"
            name="due_date"
            defaultValue={initialData?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <input type="hidden" name="currency" value={initialData?.currency || 'INR'} />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Saving...' : initialData ? 'Update Invoice' : 'Create Invoice'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>

    {showQuickCreate && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Create New Client</h2>
            <button
              type="button"
              onClick={() => setShowQuickCreate(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              &times;
            </button>
          </div>
          <QuickCreateForm onCreated={handleQuickCreated} />
        </div>
      </div>
    )}
  </>
  )
}
