export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Welcome header skeleton */}
      <div>
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="mt-2 h-4 w-96 bg-gray-200 rounded-lg" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="mt-3 h-8 w-24 bg-gray-200 rounded" />
            <div className="mt-2 h-4 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Recent activity skeleton */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 w-40 bg-gray-200 rounded" />
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-36 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
