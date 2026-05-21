export function generateWhatsAppLink(params: {
  phone: string
  message: string
}): string {
  const { phone, message } = params

  // Normalize phone number: remove spaces, dashes, parentheses
  // Keep only digits and +
  const normalizedPhone = phone.replace(/[^\d+]/g, '')

  // Remove leading + if present for wa.me format
  const cleanPhone = normalizedPhone.replace(/^\+/, '')

  // URL encode the message
  const encodedMessage = encodeURIComponent(message)

  // wa.me link format: https://wa.me/PHONE?text=MESSAGE
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

export function generateWhatsAppBusinessLink(params: {
  phone: string
  message: string
  businessPhone: string
}): string {
  // For WhatsApp Business API click-to-chat links
  // Uses the business's phone number as the sender
  return generateWhatsAppLink({ phone: params.phone, message: params.message })
}

export function copyToClipboard(message: string): void {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(message)
  }
}

export function formatPhoneForWhatsApp(phone: string): string {
  // Ensure phone has country code
  const cleaned = phone.replace(/[^\d]/g, '')

  // If it's a 10-digit Indian number, add +91
  if (cleaned.length === 10) {
    return `91${cleaned}`
  }

  // If it starts with 0 and is 11 digits (0 + 10 digits), remove the 0 and add 91
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `91${cleaned.slice(1)}`
  }

  // If it already has country code (starts with 91 and is 12 digits)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned
  }

  // Return as-is if we can't normalize
  return cleaned
}
