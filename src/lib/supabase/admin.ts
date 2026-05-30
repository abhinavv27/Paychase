import { createClient } from '@supabase/supabase-js'
import type { Database, DbClient } from './types'

let adminClient: ReturnType<typeof createClient<Database>> | null = null

export function createAdminClient() {
  if (adminClient) return adminClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for admin client'
    )
  }

  adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}

export function asDb(client: ReturnType<typeof createAdminClient>): DbClient {
  return client as unknown as DbClient
}
