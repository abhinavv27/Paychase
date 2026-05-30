export function generateWhatsAppLink(params: {
  phone: string
  message: string
}): string {
  const { phone, message } = params

  const normalizedPhone = phone.replace(/[^\d+]/g, '')
  const cleanPhone = normalizedPhone.replace(/^\+/, '')
  const encodedMessage = encodeURIComponent(message)

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

export function generateWhatsAppBusinessLink(params: {
  phone: string
  message: string
  businessPhone: string
}): string {
  return generateWhatsAppLink({ phone: params.businessPhone, message: params.message })
}

export async function copyToClipboard(message: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(message)
      return true
    } catch {
      return false
    }
  }
  return false
}

export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, '')

  if (cleaned.length === 10) {
    return `91${cleaned}`
  }

  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `91${cleaned.slice(1)}`
  }

  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned
  }

  return cleaned
}
