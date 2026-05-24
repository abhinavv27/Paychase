export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse space-y-8 p-6">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="h-4 w-96 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  )
}
