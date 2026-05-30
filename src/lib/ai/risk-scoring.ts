export function calculateRiskScore(client: {
  on_time_rate: number
  avg_payment_delay_days: number
  total_invoices: number
}, invoice: {
  due_date: string | Date
}): number {
  let score = 0.5

  // Payment history score
  if (client.on_time_rate >= 0.8) score = 0.1
  else if (client.on_time_rate >= 0.5) score = 0.4
  else if (client.on_time_rate < 0.5) score = 0.8

  // Payment delay penalty
  if (client.avg_payment_delay_days > 15) score += 0.2

  // New client uncertainty
  if (client.total_invoices < 3) score = 0.5

  // Overdue penalty
  const dueDate = new Date(invoice.due_date)
  const today = new Date()
  const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
  if (daysOverdue > 0) {
    score += 0.1 * Math.ceil(daysOverdue / 7)
  }

  return Math.min(1.0, Math.max(0.0, score))
}

export function predictPaymentDate(client: {
  avg_payment_delay_days: number
}, invoice: {
  due_date: string | Date
}): {
  predicted_date: Date
  confidence_low: Date
  confidence_high: Date
} {
  const dueDate = new Date(invoice.due_date)
  const delayMs = client.avg_payment_delay_days * 24 * 60 * 60 * 1000
  const predicted = new Date(dueDate.getTime() + delayMs)
  const confidenceWindow = 7 * 24 * 60 * 60 * 1000
  return {
    predicted_date: predicted,
    confidence_low: new Date(predicted.getTime() - confidenceWindow),
    confidence_high: new Date(predicted.getTime() + confidenceWindow),
  }
}
