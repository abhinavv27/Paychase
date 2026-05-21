import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { getInvoices } from '@/lib/invoices'

async function getClients() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')
  if (error) throw error
  return data
}

async function getNextInvoiceNumber(): Promise<string> {
  const invoices = await getInvoices()
  const nextNum = invoices.length + 1
  return `INV-${String(nextNum).padStart(3, '0')}`
}

export default async function CreateInvoicePage() {
  const [clients, nextInvoiceNumber] = await Promise.all([
    getClients(),
    getNextInvoiceNumber(),
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
