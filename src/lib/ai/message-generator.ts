import { getSentimentTone, SentimentTone } from './sentiment-templates'

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
}

export interface GeneratedMessage {
  text: string
  tone: SentimentTone
  escalationLevel: 'gentle' | 'firm' | 'urgent'
  suggestedSendTime?: string
}

export function generateFollowUpMessage(context: MessageContext): GeneratedMessage {
  const { clientName, invoiceNumber, amount, dueDate, daysOverdue, onTimeRate, reminderCount, lastResponse, userStyle = 'professional', upiLink } = context

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

  const tone = escalationLevel === 'gentle' ? 'friendly' :
               escalationLevel === 'firm' ? 'professional' : 'firm'

  const text = generateMessageText({
    clientName,
    invoiceNumber,
    amount,
    dueDate,
    daysOverdue,
    escalationLevel,
    userStyle,
    lastResponse,
    upiLink,
  })

  return { text, tone, escalationLevel }
}

function generateMessageText(params: {
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  daysOverdue: number
  escalationLevel: 'gentle' | 'firm' | 'urgent'
  userStyle: 'casual' | 'professional' | 'formal'
  lastResponse?: string
  upiLink?: string
}): string {
  const { clientName, invoiceNumber, amount, dueDate, daysOverdue, escalationLevel, userStyle, lastResponse, upiLink } = params

  const amountStr = `₹${amount.toLocaleString('en-IN')}`
  const dateStr = daysOverdue > 0 ? `${daysOverdue} days ago` : dueDate
  const paymentLink = upiLink ? `\n\nPay here: ${upiLink}` : ''

  if (escalationLevel === 'gentle') {
    if (userStyle === 'casual') {
      return `Hey ${clientName}! 👋 Just a quick reminder about invoice ${invoiceNumber} for ${amountStr} (due ${dateStr}). No rush, just didn't want it to slip through the cracks!${paymentLink}`
    }
    if (userStyle === 'formal') {
      return `Dear ${clientName}, I hope this message finds you well. This is a gentle reminder regarding invoice ${invoiceNumber} for ${amountStr}, which was due on ${dateStr}. Please let me know if you need any clarification.${paymentLink}`
    }
    return `Hi ${clientName}, hope you're doing well. Just a friendly reminder about invoice ${invoiceNumber} for ${amountStr} (due ${dateStr}). Please let me know if there's anything you need from my end.${paymentLink}`
  }

  if (escalationLevel === 'firm') {
    if (userStyle === 'casual') {
      return `Hey ${clientName}, following up on invoice ${invoiceNumber} for ${amountStr}. It's been ${daysOverdue > 0 ? `${daysOverdue} days overdue` : `due since ${dueDate}`}. Could you please update me on the payment status?${paymentLink}`
    }
    if (userStyle === 'formal') {
      return `Dear ${clientName}, I am writing to follow up on invoice ${invoiceNumber} for ${amountStr}, which is now ${daysOverdue > 0 ? `${daysOverdue} days overdue` : `due since ${dueDate}`}. I would appreciate an update on the payment timeline.${paymentLink}`
    }
    return `Hi ${clientName}, following up on invoice ${invoiceNumber} for ${amountStr}. This is now ${daysOverdue > 0 ? `${daysOverdue} days overdue` : `due since ${dueDate}`}. Could you please provide an update on when I can expect the payment?${paymentLink}`
  }

  if (userStyle === 'casual') {
    return `${clientName}, invoice ${invoiceNumber} for ${amountStr} is now ${daysOverdue > 0 ? `${daysOverdue} days overdue` : `long overdue (due ${dueDate})`}. I need this resolved this week. Please let me know when the payment will be processed.${paymentLink}`
  }
  if (userStyle === 'formal') {
    return `Dear ${clientName}, this is an urgent follow-up regarding invoice ${invoiceNumber} for ${amountStr}, which is now ${daysOverdue > 0 ? `${daysOverdue} days overdue` : `long overdue (due ${dueDate})`}. I request immediate payment or a clear timeline for settlement.${paymentLink}`
  }
  return `Hi ${clientName}, invoice ${invoiceNumber} for ${amountStr} is now ${daysOverdue > 0 ? `${daysOverdue} days overdue` : `long overdue (due ${dueDate})`}. I need this resolved urgently. Please confirm when the payment will be processed.${paymentLink}`
}

export function generateBatchMessages(invoices: MessageContext[]): GeneratedMessage[] {
  return invoices.map(generateFollowUpMessage)
}
