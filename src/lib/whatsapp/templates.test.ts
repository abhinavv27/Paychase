import { buildReminderTemplate } from './templates'

describe('buildReminderTemplate', () => {
  it('returns correct structure with required params', () => {
    const result = buildReminderTemplate({
      clientName: 'John Doe',
      invoiceNumber: 'INV-001',
      amount: 1500,
      dueDate: '2026-05-01',
      daysOverdue: 0,
    })

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('body')
    expect(result[0].parameters).toHaveLength(4)
    expect(result[0].parameters[0]).toEqual({ type: 'text', text: 'John Doe' })
    expect(result[0].parameters[1]).toEqual({ type: 'text', text: 'INV-001' })
    expect(result[0].parameters[2]).toEqual({ type: 'text', text: '₹1500' })
    expect(result[0].parameters[3]).toEqual({ type: 'text', text: 'due 2026-05-01' })
  })

  it('shows days overdue when daysOverdue > 0', () => {
    const result = buildReminderTemplate({
      clientName: 'Jane Smith',
      invoiceNumber: 'INV-042',
      amount: 3200,
      dueDate: '2026-04-15',
      daysOverdue: 5,
    })

    expect(result[0].parameters[3]).toEqual({ type: 'text', text: '5 days overdue' })
  })

  it('includes upiLink as 5th parameter when provided', () => {
    const result = buildReminderTemplate({
      clientName: 'Acme Corp',
      invoiceNumber: 'INV-100',
      amount: 9999,
      dueDate: '2026-05-10',
      daysOverdue: 3,
      upiLink: 'upi://pay?pa=paychase@okaxis&pn=PayChase',
    })

    expect(result[0].parameters).toHaveLength(5)
    expect(result[0].parameters[4]).toEqual({ type: 'text', text: 'upi://pay?pa=paychase@okaxis&pn=PayChase' })
  })

  it('excludes upiLink when not provided', () => {
    const result = buildReminderTemplate({
      clientName: 'Test User',
      invoiceNumber: 'INV-999',
      amount: 100,
      dueDate: '2026-06-01',
      daysOverdue: 0,
    })

    expect(result[0].parameters).toHaveLength(4)
  })

  it('formats amount with rupee symbol', () => {
    const result = buildReminderTemplate({
      clientName: 'X',
      invoiceNumber: 'I',
      amount: 1234.56,
      dueDate: '2026-01-01',
      daysOverdue: 0,
    })

    expect(result[0].parameters[2].text).toBe('₹1234.56')
  })
})
