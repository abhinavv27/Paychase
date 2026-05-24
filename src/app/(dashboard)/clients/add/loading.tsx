export default function AddClientLoading() {
  return (
    <div className="animate-pulse max-w-2xl mx-auto space-y-6">
      <div>
        <div className="h-8 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-200 rounded mt-2" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="h-10 w-32 bg-gray-200 rounded-lg mt-6" />
      </div>
    </div>
  )
}
