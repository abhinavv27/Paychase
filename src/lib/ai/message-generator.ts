import { getTranslation } from './translations'
import type { Language } from './translations'

export interface MessageContext {
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  daysOverdue: number
  onTimeRate: number
  reminderCount: number
  lastResponse?: string
  userStyle?: 'casual' | 'professional' | 'formal'
  upiLink?: string
  language?: Language
}

export interface GeneratedMessage {
  text: string
  escalationLevel: 'gentle' | 'firm' | 'urgent'
  suggestedSendTime: string | null
  tone: 'casual' | 'professional' | 'formal'
}

export function generateFollowUpMessage(context: MessageContext): GeneratedMessage {
  const { clientName, invoiceNumber, amount, dueDate, daysOverdue, reminderCount, lastResponse, userStyle = 'professional', upiLink, language } = context

  let escalationLevel: 'gentle' | 'firm' | 'urgent' = 'gentle'

  if (reminderCount === 0 && daysOverdue <= 3) {
    escalationLevel = 'gentle'
  } else if (reminderCount <= 2 && daysOverdue <= 14) {
    escalationLevel = 'firm'
  } else if (reminderCount > 2 || daysOverdue > 14) {
    escalationLevel = 'urgent'
  }

  if (lastResponse && !lastResponse.includes('paid')) {
    escalationLevel = escalationLevel === 'gentle' ? 'firm' : 'urgent'
  }

  const text = generateMessageText({
    clientName,
    invoiceNumber,
    amount,
    dueDate,
    daysOverdue,
    escalationLevel,
    userStyle,
    upiLink,
    language,
  })

  return { 
  text, 
  escalationLevel, 
  suggestedSendTime: null, 
  tone: escalationLevel === 'gentle' ? 'casual' : 
        escalationLevel === 'firm' ? 'professional' : 
        'formal' 
}
}

function generateMessageText(params: {
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  daysOverdue: number
  escalationLevel: 'gentle' | 'firm' | 'urgent'
  userStyle: 'casual' | 'professional' | 'formal'
  upiLink?: string
  language?: Language
}): string {
  const { clientName, invoiceNumber, amount, dueDate, daysOverdue, escalationLevel, userStyle, upiLink, language = 'en' } = params

  const amountStr = `₹${amount.toLocaleString('en-IN')}`
  const overdueText = daysOverdue > 0
    ? `${daysOverdue} ${language === 'hi' ? 'दिन' : language === 'ta' ? 'நாட்கள்' : language === 'te' ? 'రోజులు' : language === 'bn' ? 'দিন' : 'days'} ${language === 'hi' ? 'अतिदेय' : language === 'ta' ? 'தாமதமானது' : language === 'te' ? 'ఆలస్యం' : language === 'bn' ? 'অতিদেরী' : 'overdue'}`
    : dueDate

  const translate = getTranslation(language, escalationLevel, userStyle)

  return translate({
    clientName,
    invoiceNumber,
    amount: amountStr,
    dateStr: dueDate,
    overdueText,
    paymentLink: upiLink || '',
  })
}

export function generateBatchMessages(invoices: MessageContext[]): GeneratedMessage[] {
  return invoices.map(generateFollowUpMessage)
}
