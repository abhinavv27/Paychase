export default function OnboardingLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-lg animate-pulse">
        {/* Progress dots skeleton */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className="w-3 h-3 bg-gray-300 rounded-full" />
              {s < 3 && <div className="w-16 h-0.5 mx-2 bg-gray-300" />}
            </div>
          ))}
        </div>

        {/* Card skeleton */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
              <div className="h-7 w-56 bg-gray-200 rounded" />
              <div className="mt-3 h-4 w-72 bg-gray-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-10 w-full bg-gray-200 rounded-lg" />
            </div>
            <div className="flex justify-end">
              <div className="h-10 w-24 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
