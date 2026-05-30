import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { RiskCards } from '@/components/clients/risk-cards'
import { EmptyState } from '@/components/ui/empty-state'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Clients',
}

async function ClientList() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!clients || clients.length === 0) {
    return <EmptyState icon={Users} title="No clients yet" description="Add your first client to get started with payment follow-ups." actionLabel="Add your first client" actionHref="/clients/add" />
  }

  return <RiskCards clients={clients} />
}

export default function ClientsPage() {
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
        <ClientList />
      </Suspense>
    </div>
  )
}
