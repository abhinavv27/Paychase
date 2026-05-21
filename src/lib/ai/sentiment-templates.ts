export type SentimentTone = 'friendly' | 'professional' | 'firm'

export function getSentimentTone(onTimeRate: number): SentimentTone {
  if (onTimeRate >= 0.8) return 'friendly'
  if (onTimeRate >= 0.5) return 'professional'
  return 'firm'
}

export function renderReminderTemplate(params: {
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  daysOverdue: number
  tone: SentimentTone
  language?: string
  upiLink?: string
}): string {
  const { clientName, invoiceNumber, amount, dueDate, daysOverdue, tone, language = 'en', upiLink } = params

  const templates: Record<SentimentTone, string> = {
    friendly: `Hey ${clientName}! 👋 Just a friendly reminder about invoice ${invoiceNumber} for ₹${amount}${daysOverdue > 0 ? ` (due ${daysOverdue} days ago)` : ` (due ${dueDate})`}. No rush, just didn't want it to slip your mind!${upiLink ? ` Pay here: ${upiLink}` : ''}`,
    professional: `Dear ${clientName}, this is a reminder regarding invoice ${invoiceNumber} for ₹${amount}${daysOverdue > 0 ? `, which was due ${daysOverdue} days ago` : `, due on ${dueDate}`}. Please process the payment at your earliest convenience.${upiLink ? ` Pay now: ${upiLink}` : ''}`,
    firm: `URGENT: ${clientName}, invoice ${invoiceNumber} for ₹${amount} is ${daysOverdue > 0 ? `${daysOverdue} days overdue` : `due on ${dueDate}`}. Immediate payment is required. Please settle this today.${upiLink ? ` Pay immediately: ${upiLink}` : ''}`,
  }

  return templates[tone]
}
