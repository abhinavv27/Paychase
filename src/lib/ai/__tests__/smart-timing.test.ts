import { calculateOptimalSendHour } from '../smart-timing'

describe('calculateOptimalSendHour', () => {
  const makeReminder = (responseHour: number, hasResponse = true) => {
    const date = new Date()
    date.setHours(responseHour, 0, 0, 0)
    return {
      sent_at: date.toISOString(),
      ...(hasResponse ? { responded_at: date.toISOString() } : {}),
    }
  }

  it('returns default hour 10 when fewer than 10 reminders', () => {
    const reminders = Array.from({ length: 5 }, (_, i) => makeReminder(14))
    expect(calculateOptimalSendHour(reminders)).toBe(10)
  })

  it('returns 14 (2 PM) when most responses occur at 2 PM', () => {
    const reminders = [
      ...Array.from({ length: 8 }, () => makeReminder(14)),
      ...Array.from({ length: 2 }, () => makeReminder(9)),
    ]
    expect(calculateOptimalSendHour(reminders)).toBe(14)
  })

  it('returns default hour 10 when no responses at all', () => {
    const reminders = Array.from({ length: 15 }, () => ({
      sent_at: new Date().toISOString(),
    }))
    expect(calculateOptimalSendHour(reminders)).toBe(10)
  })

  it('considers read_at when responded_at is missing', () => {
    const reminders = [
      ...Array.from({ length: 8 }, () => {
        const date = new Date()
        date.setHours(16, 0, 0, 0)
        return { sent_at: date.toISOString(), read_at: date.toISOString() }
      }),
      ...Array.from({ length: 2 }, () => {
        const date = new Date()
        date.setHours(10, 0, 0, 0)
        return { sent_at: date.toISOString(), read_at: date.toISOString() }
      }),
    ]
    expect(calculateOptimalSendHour(reminders)).toBe(16)
  })

  it('ignores responses outside 6-22 hour range', () => {
    const reminders = [
      ...Array.from({ length: 5 }, () => makeReminder(3)),
      ...Array.from({ length: 5 }, () => makeReminder(11)),
    ]
    expect(calculateOptimalSendHour(reminders)).toBe(11)
  })
})
