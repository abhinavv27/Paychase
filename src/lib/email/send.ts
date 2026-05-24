import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')

const FROM_EMAIL = process.env.EMAIL_FROM || 'PayChase AI <reminders@paychase.app>'

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email send')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
