import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h2 className="text-2xl font-bold mb-4">Page not found</h2>
      <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
      <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Go home
      </Link>
    </div>
  )
}
