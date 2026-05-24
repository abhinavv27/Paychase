'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RiskBadge } from './risk-badge'
import { DeleteClientButton } from './delete-button'
import { ResponseTimeline } from './response-timeline'
import { ActivityFeed } from './activity-feed'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

interface ClientDetailShellProps {
  client: {
    id: string
    name: string
    phone?: string | null
    email?: string | null
    risk_score?: number | null
    avg_payment_delay_days?: number | null
  }
  invoices: Array<{
    id: string
    invoice_number?: string | null
    amount: number
    status: string
    issue_date: string
    due_date?: string | null
  }> | null
  reminders: Array<Record<string, unknown>> | null
}

export function ClientDetailShell({ client, invoices, reminders }: ClientDetailShellProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview')

  const totalOutstanding = invoices?.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0) ?? 0
  const paidCount = invoices?.filter(i => i.status === 'paid').length ?? 0
  const invoiceCount = invoices?.length ?? 0
  const onTimeRate = invoiceCount > 0 ? Math.round((paidCount / invoiceCount) * 100) : 0

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/clients" className="text-sm text-indigo-600 hover:text-indigo-500 mb-2 inline-block">&larr; Back to Clients</Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <RiskBadge score={client.risk_score} />
          </div>
          {client.phone && <p className="text-sm text-gray-500 mt-1">+91 {client.phone}</p>}
          {client.email && <p className="text-sm text-gray-500">{client.email}</p>}
        </div>
        <DeleteClientButton clientId={client.id} />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 text-sm font-medium ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-2 text-sm font-medium ${activeTab === 'activity' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
        >
          Activity
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{formatINR(totalOutstanding)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">On-Time Rate</p>
              <p className="mt-1 text-xl font-bold text-green-600">{onTimeRate}%</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Delay</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{client.avg_payment_delay_days ?? 0}d</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Invoices</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{invoiceCount}</p>
            </div>
          </div>

          {/* Outstanding Invoices */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Outstanding Invoices</h2>
            </div>
            {(!invoices || invoices.length === 0) ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500">No invoices for this client.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <div key={inv.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {inv.invoice_number ? `#${inv.invoice_number}` : `Invoice ${inv.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Issued {new Date(inv.issue_date).toLocaleDateString('en-IN')}
                        {inv.due_date && ` · Due ${new Date(inv.due_date).toLocaleDateString('en-IN')}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatINR(inv.amount)}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                        inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Response Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Communication History</h2>
            </div>
            <div className="px-6 py-4">
              <ResponseTimeline reminders={reminders ?? []} />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
          </div>
          <div className="px-6 py-4">
            <ActivityFeed clientId={client.id} />
          </div>
        </div>
      )}
    </div>
  )
}
