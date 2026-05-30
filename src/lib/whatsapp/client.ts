export const WHATSAPP_API_BASE = 'https://graph.facebook.com/v18.0'

export async function sendWhatsAppMessage(params: {
  phoneNumberId: string
  to: string
  templateName: string
  language: string
  components: Array<{
    type: string
    parameters: Array<{
      type: string
      text: string
    }>
  }>
  accessToken: string
}): Promise<{
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}> {
  const { phoneNumberId, to, templateName, language, components, accessToken } = params

  const response = await fetch(
    `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`WhatsApp API error: ${error.error?.message || response.statusText}`)
  }

  return response.json()
}

export async function sendTextMessage(to: string, text: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured')
  }

  const response = await fetch(
    `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`WhatsApp API error: ${error.error?.message || response.statusText}`)
  }

  return response.json()
}
