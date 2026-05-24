'use client'

import { useState } from 'react'
import { Upload, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ImportResultView } from '@/components/invoices/import-result'

export default function ImportInvoicesPage() {
  const [result, setResult] = useState<{ imported: number; errors: { row: number; message: string }[] } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/invoices/import', { method: 'POST', body: form })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ imported: 0, errors: [{ row: 0, message: 'Network error' }] })
    } finally {
      setLoading(false)
    }
  }

  if (result) return <ImportResultView result={result} onReset={() => setResult(null)} />

  return (
    <div className="max-w-lg mx-auto py-12">
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to invoices
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Import Invoices</h1>
        <p className="text-sm text-gray-500 mb-6">Upload a CSV file with columns: client_name, amount, due_date, invoice_number, client_phone, client_email</p>
        <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors">
          <FileText className="w-4 h-4" />
          {loading ? 'Uploading...' : 'Choose CSV File'}
          <input type="file" accept=".csv" onChange={handleFile} disabled={loading} className="hidden" />
        </label>
      </div>
    </div>
  )
}
