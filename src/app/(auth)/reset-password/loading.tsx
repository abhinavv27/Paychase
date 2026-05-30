export default function ResetPasswordLoading() {
  return (
    <div className="animate-pulse flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="h-8 w-48 bg-gray-200 rounded mx-auto" />
        <div className="h-4 w-64 bg-gray-200 rounded mx-auto" />
        <div className="space-y-4 mt-8">
          <div className="h-10 bg-gray-100 rounded-lg" />
          <div className="h-10 bg-gray-100 rounded-lg" />
          <div className="h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
