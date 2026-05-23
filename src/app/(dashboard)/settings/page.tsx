import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PhoneLinkForm } from './phone-link-form'
import { EditProfileForm } from './edit-profile-form'
import { DeleteAccountForm } from './delete-account-form'
import { updateStyleAction } from './actions'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error: errorParam } = await searchParams
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Profile fetch depends on user.id from getUser() above — cannot parallelize
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {errorParam && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {errorParam}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">WhatsApp Integration</h2>
        <p className="text-sm text-gray-600 mb-4">
          Link your WhatsApp number to use PayChase AI via WhatsApp commands.
        </p>

        {profile?.phone ? (
          <div className="flex items-center gap-2 text-green-600">
            <span className="text-lg">✅</span>
            <span>Linked: +{profile.phone}</span>
          </div>
        ) : (
          <PhoneLinkForm />
        )}
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Communication Style</h2>
        <p className="text-sm text-gray-600 mb-4">
          Choose how your payment reminder messages are written.
        </p>
        <form action={updateStyleAction} className="flex items-center gap-3">
          <select
            name="style"
            defaultValue={profile?.style_preference || 'professional'}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="casual">Casual</option>
            <option value="professional">Professional</option>
            <option value="formal">Formal</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <EditProfileForm name={profile?.name || null} companyName={profile?.company_name || null} />
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900 font-medium">{profile?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Plan</dt>
            <dd className="text-gray-900 font-medium capitalize">{profile?.plan}</dd>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data</h2>
        <p className="text-sm text-gray-600 mb-4">
          Export your data or delete your account.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/export"
            className="inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Export Data (JSON)
          </a>
          <DeleteAccountForm />
        </div>
      </div>
    </div>
  )
}
