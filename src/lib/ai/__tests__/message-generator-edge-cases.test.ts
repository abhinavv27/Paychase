import { generateFollowUpMessage } from '../message-generator'

function createContext(overrides: Partial<Parameters<typeof generateFollowUpMessage>[0]>): Parameters<typeof generateFollowUpMessage>[0] {
  return {
    clientName: 'Acme Corp',
    invoiceNumber: 'INV-001',
    amount: 50000,
    dueDate: '2026-05-01',
    daysOverdue: 0,
    onTimeRate: 0.9,
    reminderCount: 0,
    ...overrides,
  }
}

describe('message generator edge cases', () => {
  it('client with 0 on_time_rate and 0 total_invoices → gentle (new client, first reminder)', () => {
    const result = generateFollowUpMessage(createContext({
      onTimeRate: 0,
      reminderCount: 0,
      daysOverdue: 1,
    }))

    expect(result.escalationLevel).toBe('gentle')
    expect(result.tone).toBe('friendly')
    expect(result.text).toContain('friendly reminder')
  })

  it('very large amount (₹10,00,000) → formatted correctly', () => {
    const result = generateFollowUpMessage(createContext({
      amount: 1000000,
      daysOverdue: 2,
      reminderCount: 0,
    }))

    expect(result.text).toContain('₹10,00,000')
  })

  it('very long client name (50+ chars) → message still renders', () => {
    const longName = 'A'.repeat(60)
    const result = generateFollowUpMessage(createContext({
      clientName: longName,
      daysOverdue: 2,
      reminderCount: 0,
    }))

    expect(result.text).toContain(longName)
    expect(result.text.length).toBeGreaterThan(60)
  })

  it('daysOverdue = 0 (due today) → gentle reminder', () => {
    const result = generateFollowUpMessage(createContext({
      daysOverdue: 0,
      reminderCount: 0,
    }))

    expect(result.escalationLevel).toBe('gentle')
    expect(result.tone).toBe('friendly')
    expect(result.text).toContain('2026-05-01')
  })

  it('daysOverdue = 90 (3 months overdue) → urgent escalation', () => {
    const result = generateFollowUpMessage(createContext({
      daysOverdue: 90,
      reminderCount: 0,
    }))

    expect(result.escalationLevel).toBe('urgent')
    expect(result.tone).toBe('firm')
    expect(result.text).toContain('90 days overdue')
  })

  it('userStyle not provided → defaults to professional', () => {
    const result = generateFollowUpMessage(createContext({
      daysOverdue: 2,
      reminderCount: 0,
      userStyle: undefined,
    }))

    expect(result.text).toContain('Hi')
    expect(result.text).not.toContain('Hey')
    expect(result.text).not.toContain('Dear')
  })

  it('empty lastResponse string → treated as no response', () => {
    const withEmpty = generateFollowUpMessage(createContext({
      daysOverdue: 2,
      reminderCount: 0,
      lastResponse: '',
    }))

    const without = generateFollowUpMessage(createContext({
      daysOverdue: 2,
      reminderCount: 0,
    }))

    expect(withEmpty.escalationLevel).toBe(without.escalationLevel)
    expect(withEmpty.tone).toBe(without.tone)
  })
})
