'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, AlertCircle, CheckCircle, Download, XCircle, Loader2 } from 'lucide-react'

interface ValidationError {
  row: number
  field: string
  message: string
}

interface ValidationWarning {
  row: number
  field: string
  message: string
}

interface ValidationResult {
  valid: boolean
  clients: any[]
  invoices: any[]
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

const SAMPLE_CSV = `name,phone,email,industry,invoice_number,amount,issue_date,due_date
Acme Corp,+919876543210,billing@acme.com,Technology,INV-001,15000,2026-05-01,2026-05-31
Globex Inc,+919876543211,finance@globex.com,Manufacturing,INV-002,25000,2026-05-05,2026-06-04
Initech,+919876543212,accounts@initech.com,Consulting,INV-003,8500,2026-05-10,2026-06-09`

export default function ImportCsvPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [content, setContent] = useState<string>('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const readFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }
    setFile(file)
    setError(null)
    setValidation(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setContent(text)
    }
    reader.onerror = () => setError('Failed to read file')
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      readFile(droppedFile)
    }
  }, [readFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      readFile(selectedFile)
    }
  }, [readFile])

  const handleValidate = async () => {
    if (!content) {
      setError('Please upload a CSV file first')
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      const response = await fetch('/api/invoices/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      const data = await response.json()

      if (!response.ok) {
        setValidation({
          valid: false,
          clients: [],
          invoices: [],
          errors: data.errors || [{ row: 0, field: 'file', message: data.error || 'Validation failed' }],
          warnings: [],
        })
      } else {
        setValidation(data)
      }
    } catch (err) {
      setError('Failed to validate CSV. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (!validation || !validation.valid) return

    setIsImporting(true)
    setError(null)

    try {
      const response = await fetch('/api/invoices/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Import failed')
      } else {
        router.push('/invoices')
        router.refresh()
      }
    } catch (err) {
      setError('Failed to import CSV. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-import.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasErrors = validation && validation.errors.length > 0
  const hasWarnings = validation && validation.warnings.length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Import CSV
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload a CSV file to bulk import clients and invoices
        </p>
      </div>

      {/* Upload Area */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            {file ? (
              <span className="font-medium text-gray-900 dark:text-white">{file.name}</span>
            ) : (
              <>
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            CSV files only
          </p>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-4 flex justify-between items-center">
          <button
            type="button"
            onClick={handleDownloadSample}
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <Download className="h-4 w-4" />
            Download sample CSV
          </button>
          {content && (
            <button
              type="button"
              onClick={handleValidate}
              disabled={isValidating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate CSV'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Validation Results */}
      {validation && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Validation Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{validation.clients.length}</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Clients</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">{validation.invoices.length}</p>
                <p className="text-sm text-green-700 dark:text-green-300">Invoices</p>
              </div>
              <div className={`rounded-lg p-4 ${hasErrors ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <p className={`text-2xl font-bold ${hasErrors ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`}>
                  {validation.errors.length}
                </p>
                <p className={`text-sm ${hasErrors ? 'text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  Errors
                </p>
              </div>
              <div className={`rounded-lg p-4 ${hasWarnings ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                <p className={`text-2xl font-bold ${hasWarnings ? 'text-yellow-600' : 'text-gray-600 dark:text-gray-300'}`}>
                  {validation.warnings.length}
                </p>
                <p className={`text-sm ${hasWarnings ? 'text-yellow-700 dark:text-yellow-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  Warnings
                </p>
              </div>
            </div>

            {validation.valid && (
              <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                CSV is valid and ready to import
              </div>
            )}
          </div>

          {/* Errors */}
          {hasErrors && (
            <div className="rounded-lg border border-red-200 bg-white shadow-sm dark:border-red-800 dark:bg-gray-900">
              <div className="px-6 py-4 border-b border-red-200 dark:border-red-800">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Errors ({validation.errors.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-red-100 dark:border-red-900">
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                        Row
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                        Field
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100 dark:divide-red-900">
                    {validation.errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-red-50 dark:hover:bg-red-900/10">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-700 dark:text-red-300">
                          {err.row}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-700 dark:text-red-300">
                          {err.field}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400">
                          {err.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="rounded-lg border border-yellow-200 bg-white shadow-sm dark:border-yellow-800 dark:bg-gray-900">
              <div className="px-6 py-4 border-b border-yellow-200 dark:border-yellow-800">
                <h3 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Warnings ({validation.warnings.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-yellow-100 dark:border-yellow-900">
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-500 uppercase tracking-wider">
                        Row
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-500 uppercase tracking-wider">
                        Field
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-yellow-500 uppercase tracking-wider">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-100 dark:divide-yellow-900">
                    {validation.warnings.map((warn, idx) => (
                      <tr key={idx} className="hover:bg-yellow-50 dark:hover:bg-yellow-900/10">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-700 dark:text-yellow-300">
                          {warn.row}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-700 dark:text-yellow-300">
                          {warn.field}
                        </td>
                        <td className="px-6 py-4 text-sm text-yellow-600 dark:text-yellow-400">
                          {warn.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={!validation.valid || isImporting}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                'Import Data'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/invoices')}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
