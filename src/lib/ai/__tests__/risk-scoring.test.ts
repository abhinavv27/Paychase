import { calculateRiskScore, predictPaymentDate } from '../risk-scoring'

describe('calculateRiskScore', () => {
  const makeInvoice = (daysFromNow: number) => {
    const date = new Date()
    date.setDate(date.getDate() + daysFromNow)
    return { due_date: date.toISOString() }
  }

  it('returns low risk (~0.1) for client with 90% on-time rate', () => {
    const score = calculateRiskScore(
      { on_time_rate: 0.9, avg_payment_delay_days: 2, total_invoices: 10 },
      makeInvoice(7)
    )
    expect(score).toBeCloseTo(0.1, 1)
  })

  it('returns high risk (~0.8) for client with 30% on-time rate', () => {
    const score = calculateRiskScore(
      { on_time_rate: 0.3, avg_payment_delay_days: 5, total_invoices: 10 },
      makeInvoice(7)
    )
    expect(score).toBeCloseTo(0.8, 1)
  })

  it('increases risk when invoice is 14 days overdue', () => {
    const overdueInvoice = makeInvoice(-14)
    const baseScore = calculateRiskScore(
      { on_time_rate: 0.9, avg_payment_delay_days: 2, total_invoices: 10 },
      makeInvoice(7)
    )
    const overdueScore = calculateRiskScore(
      { on_time_rate: 0.9, avg_payment_delay_days: 2, total_invoices: 10 },
      overdueInvoice
    )
    expect(overdueScore).toBeGreaterThan(baseScore)
  })

  it('returns neutral risk (0.5) for new client with < 3 invoices', () => {
    const score = calculateRiskScore(
      { on_time_rate: 0.9, avg_payment_delay_days: 2, total_invoices: 1 },
      makeInvoice(7)
    )
    expect(score).toBe(0.5)
  })

  it('score never exceeds 1.0', () => {
    const veryOverdue = makeInvoice(-60)
    const score = calculateRiskScore(
      { on_time_rate: 0.1, avg_payment_delay_days: 30, total_invoices: 20 },
      veryOverdue
    )
    expect(score).toBeLessThanOrEqual(1.0)
  })

  it('score never goes below 0.0', () => {
    const score = calculateRiskScore(
      { on_time_rate: 1.0, avg_payment_delay_days: 0, total_invoices: 100 },
      makeInvoice(30)
    )
    expect(score).toBeGreaterThanOrEqual(0.0)
  })

  it('adds delay penalty when avg_payment_delay_days > 15', () => {
    const withDelay = calculateRiskScore(
      { on_time_rate: 0.9, avg_payment_delay_days: 20, total_invoices: 10 },
      makeInvoice(7)
    )
    const withoutDelay = calculateRiskScore(
      { on_time_rate: 0.9, avg_payment_delay_days: 5, total_invoices: 10 },
      makeInvoice(7)
    )
    expect(withDelay).toBeGreaterThan(withoutDelay)
  })

  it('handles edge case: exactly 0.8 on_time_rate', () => {
    const score = calculateRiskScore(
      { on_time_rate: 0.8, avg_payment_delay_days: 0, total_invoices: 5 },
      makeInvoice(7)
    )
    expect(score).toBe(0.1)
  })

  it('handles edge case: exactly 0.5 on_time_rate', () => {
    const score = calculateRiskScore(
      { on_time_rate: 0.5, avg_payment_delay_days: 0, total_invoices: 5 },
      makeInvoice(7)
    )
    expect(score).toBe(0.4)
  })
})

describe('predictPaymentDate', () => {
  it('predicts date based on avg_payment_delay_days', () => {
    const dueDate = new Date('2026-06-01')
    const result = predictPaymentDate(
      { avg_payment_delay_days: 5 },
      { due_date: dueDate }
    )
    const expected = new Date('2026-06-06')
    expect(result.predicted_date.getTime()).toBe(expected.getTime())
  })

  it('confidence window is ±7 days from predicted date', () => {
    const dueDate = new Date('2026-06-01')
    const result = predictPaymentDate(
      { avg_payment_delay_days: 0 },
      { due_date: dueDate }
    )
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
    expect(result.predicted_date.getTime() - result.confidence_low.getTime()).toBe(sevenDaysMs)
    expect(result.confidence_high.getTime() - result.predicted_date.getTime()).toBe(sevenDaysMs)
  })

  it('handles negative delay (early payment)', () => {
    const dueDate = new Date('2026-06-01')
    const result = predictPaymentDate(
      { avg_payment_delay_days: -3 },
      { due_date: dueDate }
    )
    const expected = new Date('2026-05-29')
    expect(result.predicted_date.getTime()).toBe(expected.getTime())
  })
})
