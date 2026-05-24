import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '@/components/invoices/invoice-form'

async function getClients(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', userId)
    .order('name')
  if (error) throw error
  return data
}

async function getNextInvoiceNumber(userId: string): Promise<string> {
  const supabase = createClient()
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  const nextNum = (count || 0) + 1
  return `INV-${String(nextNum).padStart(3, '0')}`
}

export default async function CreateInvoicePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-8 text-center text-gray-500">You must be logged in to create an invoice.</div>
  }

  const [clients, nextInvoiceNumber] = await Promise.all([
    getClients(user.id),
    getNextInvoiceNumber(user.id),
  ])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details to create a new invoice
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <InvoiceForm
          clients={clients}
          nextInvoiceNumber={nextInvoiceNumber}
        />
      </div>
    </div>
  )
}
