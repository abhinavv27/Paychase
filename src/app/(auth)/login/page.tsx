import Link from 'next/link'
import { login } from '../actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const { message, error } = await searchParams

  return (
    <form className="mt-8 space-y-6" action={login}>
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href="/forgot-password"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Sign in with email
      </button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
          Sign up
        </Link>
      </p>
    </form>
  )
}
