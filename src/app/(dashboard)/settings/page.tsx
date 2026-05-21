import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { linkExistingUserPhone } from '@/lib/whatsapp/user-linking'
import { revalidatePath } from 'next/cache'

async function handleLinkPhone(formData: FormData) {
  'use server'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const phone = formData.get('phone') as string

  if (!phone) {
    return
  }

  const result = await linkExistingUserPhone(user.id, phone)

  if (result.success) {
    revalidatePath('/settings')
  }
}

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
          <form action={handleLinkPhone} className="flex gap-2">
            <input
              type="tel"
              name="phone"
              placeholder="+91 98765 43210"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
            >
              Link
            </button>
          </form>
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
