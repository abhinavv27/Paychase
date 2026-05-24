import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientDetailShell } from '@/components/clients/client-detail-shell'

export const metadata = {
  title: 'Client Details',
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: client }, { data: invoices }, { data: reminders }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', params.id).eq('user_id', user.id).single(),
    supabase.from('invoices').select('*').eq('client_id', params.id).eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('reminders').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
  ])

  if (!client) notFound()

  return (
    <ClientDetailShell client={client} invoices={invoices} reminders={reminders} />
  )
}
