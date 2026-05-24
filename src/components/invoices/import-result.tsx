'use client'

import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface ImportResultViewProps {
  result: { imported: number; errors: { row: number; message: string }[]; skipped: number }
  onReset: () => void
}

export function ImportResultView({ result, onReset }: ImportResultViewProps) {
  return (
    <div className="max-w-lg mx-auto py-12">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="text-center mb-6">
          {result.imported > 0 ? (
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          ) : (
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          )}
          <h2 className="text-xl font-bold text-gray-900">Import Complete</h2>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm py-2 border-b border-gray-100">
            <span className="text-gray-500">Imported</span>
            <span className="font-medium text-green-600">{result.imported}</span>
          </div>
          {result.errors.length > 0 && (
            <div className="flex justify-between text-sm py-2 border-b border-gray-100">
              <span className="text-gray-500">Errors</span>
              <span className="font-medium text-red-600">{result.errors.length}</span>
            </div>
          )}
        </div>
        {result.errors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Errors</h3>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600">Row {err.row}: {err.message}</p>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <Link href="/invoices" className="flex-1 py-2.5 text-center text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">View Invoices</Link>
          <button onClick={onReset} className="flex items-center gap-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Import More
          </button>
        </div>
      </div>
    </div>
  )
}
