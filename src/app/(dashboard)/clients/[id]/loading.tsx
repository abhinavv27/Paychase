export default function Loading() {
  return (
    <div className="space-y-6 max-w-4xl animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
        </div>
        <div className="h-8 w-20 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-6 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  )
}
