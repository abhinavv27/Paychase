export function RiskDistribution({ low, medium, high }: {
  low: number
  medium: number
  high: number
}) {
  const total = low + medium + high
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">Risk Distribution</h3>
      <div className="mt-4 space-y-3">
        {[
          { label: 'Low Risk', count: low, color: 'bg-green-500' },
          { label: 'Medium Risk', count: medium, color: 'bg-yellow-500' },
          { label: 'High Risk', count: high, color: 'bg-red-500' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-24 text-sm text-gray-600">{item.label}</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full`}
                style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
              />
            </div>
            <span className="w-12 text-sm text-gray-600 text-right">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
