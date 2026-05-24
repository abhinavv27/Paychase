'use client'

interface HealthScoreProps {
  score: number
  level: 'healthy' | 'moderate' | 'critical'
}

const config = {
  healthy: { color: '#22c55e', bg: '#f0fdf4', label: 'Good shape' },
  moderate: { color: '#eab308', bg: '#fefce8', label: 'Needs attention' },
  critical: { color: '#dc2626', bg: '#fef2f2', label: 'Needs improvement' },
}

export function HealthScore({ score, level }: HealthScoreProps) {
  const c = config[level]
  const r = 54
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <h3 className="text-sm font-medium text-gray-900">Collection Health</h3>
      <div className="flex items-center gap-4 mt-4">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={c.color} strokeWidth="12"
            strokeDasharray={circumference} strokeDashoffset={offset}
            transform="rotate(-90 70 70)" strokeLinecap="round" />
          <text x="70" y="68" textAnchor="middle" dominantBaseline="central" className="text-2xl font-bold" fill="currentColor">{score}</text>
          <text x="70" y="86" textAnchor="middle" dominantBaseline="central" className="text-xs" fill="#666">/100</text>
        </svg>
        <div>
          <p className="text-sm font-medium text-gray-900 capitalize">{level}</p>
          <p className="text-xs text-gray-500 mt-1">{c.label}</p>
        </div>
      </div>
    </div>
  )
}
