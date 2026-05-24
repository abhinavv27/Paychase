import * as Sentry from '@sentry/nextjs'

export async function register() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    enabled: process.env.NODE_ENV === 'production',
  })
}
