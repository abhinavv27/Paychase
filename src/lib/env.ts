const requiredServerEnv = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
  'WHATSAPP_APP_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'CRON_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
]

const requiredPublicEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

export function validateEnv() {
  const missing: string[] = []

  for (const key of requiredServerEnv) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  for (const key of requiredPublicEnv) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[env] Missing environment variables (dev mode, continuing): ${missing.join(', ')}`
      )
    } else {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      )
    }
  }
}
