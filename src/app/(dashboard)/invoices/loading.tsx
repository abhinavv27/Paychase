export default function InvoicesLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-200 rounded mt-2" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-gray-100 rounded-lg" />
          <div className="h-10 w-36 bg-gray-200 rounded-lg" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-gray-100 rounded-lg" />
            <div className="h-8 w-20 bg-gray-100 rounded-lg" />
            <div className="h-8 w-16 bg-gray-100 rounded-lg" />
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-50 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
