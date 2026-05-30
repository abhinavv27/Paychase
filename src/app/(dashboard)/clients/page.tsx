import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import Link from 'next/link'
import { RiskBadge } from '@/components/clients/risk-badge'

export const metadata: Metadata = {
  title: 'Clients',
}

const PAGE_SIZE = 20

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

async function ClientTable({ page }: { page: number }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const [{ data: clients }, { count }] = await Promise.all([
    supabase.from('clients').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).range(from, to),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE))

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No clients yet.</p>
        <Link
          href="/clients/add"
          className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Add your first client
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Risk Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Outstanding</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">On-Time Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{client.name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{client.phone ? `+91 ${client.phone}` : '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{client.email ?? '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm"><RiskBadge score={client.risk_score} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatCurrency(client.total_outstanding)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{(client.on_time_rate * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={`/clients?page=${page - 1}`} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Previous</Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">Previous</span>
            )}
            {page < totalPages ? (
              <Link href={`/clients?page=${page + 1}`} className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Next</Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed">Next</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ClientsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
        <Link
          href="/clients/add"
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Add Client
        </Link>
      </div>
      <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>}>
        <ClientTable page={currentPage} />
      </Suspense>
    </div>
  )
}
