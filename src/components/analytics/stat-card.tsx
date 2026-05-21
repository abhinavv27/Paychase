export function StatCard({ title, value, change, icon }: {
  title: string
  value: string
  change?: { value: string; positive: boolean }
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="text-gray-400">{icon}</div>
      </div>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      {change && (
        <p className={`mt-1 text-sm ${change.positive ? 'text-green-600' : 'text-red-600'}`}>
          {change.positive ? '↑' : '↓'} {change.value} vs last month
        </p>
      )}
    </div>
  )
}
