import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Get paid 15 days faster without a single awkward follow-up
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Built for Indian freelancers, agencies, and small businesses who hate chasing payments. PayChase AI drafts and sends WhatsApp payment reminders that feel human — so you stop nagging and start collecting.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-8 py-3 text-base font-medium text-white shadow-sm hover:bg-gray-800 transition-colors"
          >
            Start free
          </Link>
          <p className="text-xs text-gray-400">No credit card needed · 2-minute setup</p>
        </div>
      </div>
    </div>
  )
}
