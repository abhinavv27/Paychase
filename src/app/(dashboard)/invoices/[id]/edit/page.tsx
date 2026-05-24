import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { RegeneratePaymentLinkButton } from '@/components/invoices/regenerate-payment-link-button'
import { notFound } from 'next/navigation'

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) notFound()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, client:clients(id, name)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !invoice) notFound()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update invoice details below
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <InvoiceForm
          clients={clients || []}
          initialData={invoice}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Payment Link</h2>
        <p className="text-sm text-gray-500 mb-3">
          {invoice.upi_link
            ? `Current link: ${invoice.upi_link}`
            : 'No payment link generated yet.'}
        </p>
        <RegeneratePaymentLinkButton invoiceId={params.id} />
      </div>
    </div>
  )
}
