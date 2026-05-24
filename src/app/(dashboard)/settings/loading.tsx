export default function SettingsLoading() {
  return (
    <div className="animate-pulse max-w-2xl space-y-6">
      <div className="h-8 w-32 bg-gray-200 rounded" />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-100 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="space-y-3">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-36 bg-gray-200 rounded" />
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}
