import { getSentimentTone, renderReminderTemplate } from '../sentiment-templates'

describe('getSentimentTone', () => {
  it('returns friendly for on_time_rate 0.9', () => {
    expect(getSentimentTone(0.9)).toBe('friendly')
  })

  it('returns professional for on_time_rate 0.6', () => {
    expect(getSentimentTone(0.6)).toBe('professional')
  })

  it('returns firm for on_time_rate 0.3', () => {
    expect(getSentimentTone(0.3)).toBe('firm')
  })

  it('returns friendly for exactly 0.8', () => {
    expect(getSentimentTone(0.8)).toBe('friendly')
  })

  it('returns professional for exactly 0.5', () => {
    expect(getSentimentTone(0.5)).toBe('professional')
  })
})

describe('renderReminderTemplate', () => {
  const baseParams = {
    clientName: 'Rahul',
    invoiceNumber: 'INV-001',
    amount: 5000,
    dueDate: '2026-06-01',
    daysOverdue: 0,
    tone: 'friendly' as const,
  }

  it('friendly template includes casual language', () => {
    const result = renderReminderTemplate({ ...baseParams, tone: 'friendly' })
    expect(result).toContain('Hey')
    expect(result).toContain('friendly reminder')
    expect(result).toContain('No rush')
  })

  it('professional template includes formal language', () => {
    const result = renderReminderTemplate({ ...baseParams, tone: 'professional' })
    expect(result).toContain('Dear')
    expect(result).toContain('reminder regarding')
    expect(result).toContain('earliest convenience')
  })

  it('firm template includes urgent language', () => {
    const result = renderReminderTemplate({ ...baseParams, tone: 'firm' })
    expect(result).toContain('URGENT')
    expect(result).toContain('Immediate payment')
    expect(result).toContain('settle this today')
  })

  it('includes UPI link when provided', () => {
    const result = renderReminderTemplate({
      ...baseParams,
      tone: 'friendly',
      upiLink: 'upi://pay?pa=test@upi',
    })
    expect(result).toContain('upi://pay?pa=test@upi')
  })

  it('shows days overdue when daysOverdue > 0', () => {
    const result = renderReminderTemplate({ ...baseParams, daysOverdue: 5, tone: 'friendly' })
    expect(result).toContain('5 days ago')
  })

  it('shows due date when not overdue', () => {
    const result = renderReminderTemplate({ ...baseParams, daysOverdue: 0, tone: 'friendly' })
    expect(result).toContain('due 2026-06-01')
  })

  it('includes client name, invoice number, and amount', () => {
    const result = renderReminderTemplate({ ...baseParams, tone: 'professional' })
    expect(result).toContain('Rahul')
    expect(result).toContain('INV-001')
    expect(result).toContain('5000')
  })
})
