export default function ApprovalsLoading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="h-4 w-96 bg-gray-200 rounded" />
      <div className="space-y-3 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
