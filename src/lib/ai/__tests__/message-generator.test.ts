import { generateFollowUpMessage, generateBatchMessages, MessageContext } from '../message-generator'

function createContext(overrides: Partial<MessageContext>): MessageContext {
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

describe('generateFollowUpMessage', () => {
  it('first reminder, 2 days overdue → gentle, friendly tone', () => {
    const result = generateFollowUpMessage(createContext({ daysOverdue: 2, reminderCount: 0 }))

    expect(result.escalationLevel).toBe('gentle')
    expect(result.tone).toBe('friendly')
    expect(result.text).toContain('friendly reminder')
  })

  it('second reminder, 10 days overdue → firm, professional tone', () => {
    const result = generateFollowUpMessage(createContext({ daysOverdue: 10, reminderCount: 1 }))

    expect(result.escalationLevel).toBe('firm')
    expect(result.tone).toBe('professional')
    expect(result.text).toContain('following up')
  })

  it('fourth reminder, 20 days overdue → urgent, firm tone', () => {
    const result = generateFollowUpMessage(createContext({ daysOverdue: 20, reminderCount: 4 }))

    expect(result.escalationLevel).toBe('urgent')
    expect(result.tone).toBe('firm')
    expect(result.text.toLowerCase()).toContain('urgently')
  })

  it('client responded last time but didn\'t pay → escalates one level', () => {
    const gentleResult = generateFollowUpMessage(createContext({
      daysOverdue: 2,
      reminderCount: 0,
      lastResponse: 'I will pay soon',
    }))

    expect(gentleResult.escalationLevel).toBe('firm')
    expect(gentleResult.tone).toBe('professional')

    const firmResult = generateFollowUpMessage(createContext({
      daysOverdue: 10,
      reminderCount: 1,
      lastResponse: 'Processing it next week',
    }))

    expect(firmResult.escalationLevel).toBe('urgent')
    expect(firmResult.tone).toBe('firm')
  })

  it('client responded with "paid" → does not escalate', () => {
    const result = generateFollowUpMessage(createContext({
      daysOverdue: 2,
      reminderCount: 0,
      lastResponse: 'Already paid yesterday',
    }))

    expect(result.escalationLevel).toBe('gentle')
    expect(result.tone).toBe('friendly')
  })

  it('casual user style → casual language', () => {
    const casualGentle = generateFollowUpMessage(createContext({
      daysOverdue: 2,
      reminderCount: 0,
      userStyle: 'casual',
    }))

    expect(casualGentle.text).toContain('Hey')
    expect(casualGentle.text).toContain('👋')

    const casualFirm = generateFollowUpMessage(createContext({
      daysOverdue: 10,
      reminderCount: 1,
      userStyle: 'casual',
    }))

    expect(casualFirm.text).toContain('Hey')
    expect(casualFirm.text).toContain('Could you please update me')

    const casualUrgent = generateFollowUpMessage(createContext({
      daysOverdue: 20,
      reminderCount: 4,
      userStyle: 'casual',
    }))

    expect(casualUrgent.text).toContain('I need this resolved this week')
  })

  it('formal user style → formal language', () => {
    const formalGentle = generateFollowUpMessage(createContext({
      daysOverdue: 2,
      reminderCount: 0,
      userStyle: 'formal',
    }))

    expect(formalGentle.text).toContain('Dear')
    expect(formalGentle.text).toContain('I hope this message finds you well')

    const formalFirm = generateFollowUpMessage(createContext({
      daysOverdue: 10,
      reminderCount: 1,
      userStyle: 'formal',
    }))

    expect(formalFirm.text).toContain('Dear')
    expect(formalFirm.text).toContain('I am writing to follow up')

    const formalUrgent = generateFollowUpMessage(createContext({
      daysOverdue: 20,
      reminderCount: 4,
      userStyle: 'formal',
    }))

    expect(formalUrgent.text).toContain('Dear')
    expect(formalUrgent.text).toContain('I request immediate payment')
  })

  it('UPI link included when provided', () => {
    const result = generateFollowUpMessage(createContext({
      daysOverdue: 2,
      reminderCount: 0,
      upiLink: 'upi://pay?pa=test@okicici',
    }))

    expect(result.text).toContain('Pay here: upi://pay?pa=test@okicici')
  })

  it('UPI link not included when not provided', () => {
    const result = generateFollowUpMessage(createContext({
      daysOverdue: 2,
      reminderCount: 0,
    }))

    expect(result.text).not.toContain('Pay here:')
  })

  it('amount formatted with Indian locale', () => {
    const result = generateFollowUpMessage(createContext({
      amount: 100000,
      daysOverdue: 2,
      reminderCount: 0,
    }))

    expect(result.text).toContain('₹1,00,000')
  })

  it('professional style is default', () => {
    const result = generateFollowUpMessage(createContext({
      daysOverdue: 2,
      reminderCount: 0,
    }))

    expect(result.text).toContain('Hi')
    expect(result.text).toContain('friendly reminder')
  })
})

describe('generateBatchMessages', () => {
  it('generates messages for multiple invoices', () => {
    const invoices: MessageContext[] = [
      createContext({ clientName: 'Client A', daysOverdue: 2, reminderCount: 0 }),
      createContext({ clientName: 'Client B', daysOverdue: 10, reminderCount: 1 }),
      createContext({ clientName: 'Client C', daysOverdue: 20, reminderCount: 4 }),
    ]

    const results = generateBatchMessages(invoices)

    expect(results).toHaveLength(3)
    expect(results[0].escalationLevel).toBe('gentle')
    expect(results[1].escalationLevel).toBe('firm')
    expect(results[2].escalationLevel).toBe('urgent')
    expect(results[0].text).toContain('Client A')
    expect(results[1].text).toContain('Client B')
    expect(results[2].text).toContain('Client C')
  })

  it('returns empty array for empty input', () => {
    const results = generateBatchMessages([])
    expect(results).toEqual([])
  })
})
