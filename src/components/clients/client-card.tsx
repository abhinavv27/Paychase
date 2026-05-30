import Link from 'next/link'
import { RiskBadge } from './risk-badge'

interface ClientCardProps {
  id: string
  name: string
  phone: string | null
  total_outstanding: number
  avg_payment_delay_days: number
  on_time_rate: number
  risk_score: number
}

export function ClientCard({ id, name, phone, total_outstanding, avg_payment_delay_days, on_time_rate, risk_score }: ClientCardProps) {
  return (
    <Link href={`/clients/${id}`} className="block border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{name}</h3>
          {phone && <p className="text-xs text-gray-500 mt-0.5">{phone}</p>}
        </div>
        <RiskBadge score={risk_score} />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-xs"><span className="text-gray-500">Outstanding</span><span className="font-medium">₹{total_outstanding.toLocaleString('en-IN')}</span></div>
        <div className="flex justify-between text-xs"><span className="text-gray-500">Avg Delay</span><span className="font-medium">{avg_payment_delay_days}d</span></div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">On-time rate</span><span>{Math.round(on_time_rate * 100)}%</span></div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, on_time_rate * 100)}%` }} />
        </div>
      </div>
    </Link>
  )
}
