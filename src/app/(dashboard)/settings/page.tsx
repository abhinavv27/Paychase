import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PhoneLinkForm } from './phone-link-form'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function SettingsPage() {
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Name</dt>
            <dd className="text-gray-900 font-medium">{profile?.name || 'Not set'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900 font-medium">{profile?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Company</dt>
            <dd className="text-gray-900 font-medium">{profile?.company_name || 'Not set'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Plan</dt>
            <dd className="text-gray-900 font-medium capitalize">{profile?.plan}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
