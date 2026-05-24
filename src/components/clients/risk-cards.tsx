'use client'

import { useState } from 'react'
import { ClientCard } from './client-card'
import { Search } from 'lucide-react'

interface Client {
  id: string
  name: string
  phone: string | null
  total_outstanding: number
  avg_payment_delay_days: number
  on_time_rate: number
  risk_score: number
}

export function RiskCards({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'outstanding' | 'risk'>('name')

  const filtered = clients
    .filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
      const matchesRisk =
        riskFilter === 'all'
          ? true
          : riskFilter === 'low'
            ? c.risk_score < 0.3
            : riskFilter === 'medium'
              ? c.risk_score >= 0.3 && c.risk_score < 0.7
              : c.risk_score >= 0.7
      return matchesSearch && matchesRisk
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'outstanding') return b.total_outstanding - a.total_outstanding
      return b.risk_score - a.risk_score
    })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
        >
          <option value="name">Sort by Name</option>
          <option value="outstanding">Sort by Outstanding</option>
          <option value="risk">Sort by Risk</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500">
          {clients.length === 0 ? 'No clients yet.' : `${clients.length} total clients. None match your current filters.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard key={client.id} {...client} />
          ))}
        </div>
      )}
    </div>
  )
}
