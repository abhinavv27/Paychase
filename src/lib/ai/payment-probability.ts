export function calculatePaymentProbability(invoice: {
  daysOverdue: number
  clientOnTimeRate: number
  clientAvgDelayDays: number
}): { probability7: number; probability30: number; probability60: number } {
  const base = invoice.clientOnTimeRate / 100
  const delayFactor = Math.max(0.5, 1 - (invoice.clientAvgDelayDays / 90))
  const ageFactor = Math.max(0.2, 1 - (invoice.daysOverdue / 120))

  const prob7 = Math.round(Math.max(1, Math.min(99, base * delayFactor * 100)))
  const prob30 = Math.round(Math.max(1, Math.min(99, base * delayFactor * ageFactor * 1.5 * 100)))
  const prob60 = Math.round(Math.max(1, Math.min(99, base * delayFactor * Math.sqrt(ageFactor) * 2 * 100)))

  return { probability7: prob7, probability30: prob30, probability60: prob60 }
}
