'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  created_at: string
}

export async function createOrganization(name: string): Promise<Organization> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)

  const { data: org, error } = await supabase
    .from('organizations')
    .insert({ name, slug })
    .select()
    .single()

  if (error) throw new Error(error.message)

  const { error: memberError } = await supabase.from('organization_members').insert({
    organization_id: org.id,
    user_id: user.id,
    role: 'admin',
    joined_at: new Date().toISOString(),
  })

  if (memberError) throw new Error(memberError.message)

  revalidatePath('/settings/team')
  return org
}

export async function getUserOrganizations(): Promise<Organization[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('organization_members')
    .select('organization:organizations(*)')
    .eq('user_id', user.id)

  return (data || []).map((d: Record<string, unknown>) => d.organization as Organization)
}
