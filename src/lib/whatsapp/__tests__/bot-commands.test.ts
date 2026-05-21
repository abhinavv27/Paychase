import { parseCommand, getHelpText } from '../bot-commands'

describe('parseCommand', () => {
  describe('help command', () => {
    it('matches "help"', () => {
      expect(parseCommand('help')).toEqual({
        command: 'help',
        rawText: 'help',
        params: {},
      })
    })

    it('matches "HELP" (case insensitive)', () => {
      expect(parseCommand('HELP')).toEqual({
        command: 'help',
        rawText: 'HELP',
        params: {},
      })
    })

    it('matches "h"', () => {
      expect(parseCommand('h')).toEqual({
        command: 'help',
        rawText: 'h',
        params: {},
      })
    })

    it('matches "?"', () => {
      expect(parseCommand('?')).toEqual({
        command: 'help',
        rawText: '?',
        params: {},
      })
    })

    it('matches "menu"', () => {
      expect(parseCommand('menu')).toEqual({
        command: 'help',
        rawText: 'menu',
        params: {},
      })
    })
  })

  describe('status command', () => {
    it('matches "who owes"', () => {
      expect(parseCommand('who owes')).toEqual({
        command: 'status',
        rawText: 'who owes',
        params: {},
      })
    })

    it('matches "STATUS" (case insensitive)', () => {
      expect(parseCommand('STATUS')).toEqual({
        command: 'status',
        rawText: 'STATUS',
        params: {},
      })
    })

    it('matches "overdue"', () => {
      expect(parseCommand('overdue')).toEqual({
        command: 'status',
        rawText: 'overdue',
        params: {},
      })
    })

    it('matches "outstanding"', () => {
      expect(parseCommand('outstanding')).toEqual({
        command: 'status',
        rawText: 'outstanding',
        params: {},
      })
    })

    it('matches "who owes me"', () => {
      expect(parseCommand('who owes me')).toEqual({
        command: 'status',
        rawText: 'who owes me',
        params: {},
      })
    })

    it('matches "balance"', () => {
      expect(parseCommand('balance')).toEqual({
        command: 'status',
        rawText: 'balance',
        params: {},
      })
    })
  })

  describe('followup command', () => {
    it('matches "followup"', () => {
      expect(parseCommand('followup')).toEqual({
        command: 'followup',
        rawText: 'followup',
        params: {},
      })
    })

    it('matches "SEND" (case insensitive)', () => {
      expect(parseCommand('SEND')).toEqual({
        command: 'followup',
        rawText: 'SEND',
        params: {},
      })
    })

    it('matches "chase"', () => {
      expect(parseCommand('chase')).toEqual({
        command: 'followup',
        rawText: 'chase',
        params: {},
      })
    })

    it('matches "follow up" (with space)', () => {
      expect(parseCommand('follow up')).toEqual({
        command: 'followup',
        rawText: 'follow up',
        params: {},
      })
    })

    it('matches "follow-up" (with hyphen)', () => {
      expect(parseCommand('follow-up')).toEqual({
        command: 'followup',
        rawText: 'follow-up',
        params: {},
      })
    })

    it('matches "remind"', () => {
      expect(parseCommand('remind')).toEqual({
        command: 'followup',
        rawText: 'remind',
        params: {},
      })
    })
  })

  describe('followup_specific command', () => {
    it('matches "followup Acme Corp" with clientName', () => {
      expect(parseCommand('followup Acme Corp')).toEqual({
        command: 'followup_specific',
        rawText: 'followup Acme Corp',
        params: { clientName: 'Acme Corp' },
      })
    })

    it('matches "send John Doe" with clientName', () => {
      expect(parseCommand('send John Doe')).toEqual({
        command: 'followup_specific',
        rawText: 'send John Doe',
        params: { clientName: 'John Doe' },
      })
    })

    it('matches "chase StartupXYZ" with clientName', () => {
      expect(parseCommand('chase StartupXYZ')).toEqual({
        command: 'followup_specific',
        rawText: 'chase StartupXYZ',
        params: { clientName: 'StartupXYZ' },
      })
    })
  })

  describe('add_client command', () => {
    it('parses "add client DesignCo 9876543210 50000 2026-06-15" with all params', () => {
      const result = parseCommand('add client DesignCo 9876543210 50000 2026-06-15')
      expect(result.command).toBe('add_client')
      expect(result.params.clientName).toBe('DesignCo')
      expect(result.params.phone).toBe('9876543210')
      expect(result.params.amount).toBe(50000)
      expect(result.params.dueDate).toBe('2026-06-15')
    })

    it('parses "add client StartupXYZ 50000 2026-06-15" without phone', () => {
      const result = parseCommand('add client StartupXYZ 50000 2026-06-15')
      expect(result.command).toBe('add_client')
      expect(result.params.clientName).toBe('StartupXYZ')
      expect(result.params.phone).toBeUndefined()
      expect(result.params.amount).toBe(50000)
      expect(result.params.dueDate).toBe('2026-06-15')
    })

    it('parses multi-word client names', () => {
      const result = parseCommand('add client Acme Corporation 9876543210 75000 2026-07-01')
      expect(result.command).toBe('add_client')
      expect(result.params.clientName).toBe('Acme Corporation')
      expect(result.params.phone).toBe('9876543210')
      expect(result.params.amount).toBe(75000)
      expect(result.params.dueDate).toBe('2026-07-01')
    })

    it('supports "add customer" variant', () => {
      const result = parseCommand('add customer TestCo 9876543210 10000 2026-08-01')
      expect(result.command).toBe('add_client')
      expect(result.params.clientName).toBe('TestCo')
    })
  })

  describe('mark_paid command', () => {
    it('matches "paid INV-001" with invoiceNumber', () => {
      expect(parseCommand('paid INV-001')).toEqual({
        command: 'mark_paid',
        rawText: 'paid INV-001',
        params: { invoiceNumber: 'INV-001' },
      })
    })

    it('matches "received INV-042" with invoiceNumber', () => {
      expect(parseCommand('received INV-042')).toEqual({
        command: 'mark_paid',
        rawText: 'received INV-042',
        params: { invoiceNumber: 'INV-042' },
      })
    })

    it('matches "collected INV-100" with invoiceNumber', () => {
      expect(parseCommand('collected INV-100')).toEqual({
        command: 'mark_paid',
        rawText: 'collected INV-100',
        params: { invoiceNumber: 'INV-100' },
      })
    })
  })

  describe('stop command', () => {
    it('matches "stop"', () => {
      expect(parseCommand('stop')).toEqual({
        command: 'stop',
        rawText: 'stop',
        params: {},
      })
    })

    it('matches "pause"', () => {
      expect(parseCommand('pause')).toEqual({
        command: 'stop',
        rawText: 'pause',
        params: {},
      })
    })

    it('matches "mute"', () => {
      expect(parseCommand('mute')).toEqual({
        command: 'stop',
        rawText: 'mute',
        params: {},
      })
    })

    it('matches "quiet"', () => {
      expect(parseCommand('quiet')).toEqual({
        command: 'stop',
        rawText: 'quiet',
        params: {},
      })
    })
  })

  describe('unknown command', () => {
    it('returns unknown for random text', () => {
      expect(parseCommand('random text')).toEqual({
        command: 'unknown',
        rawText: 'random text',
        params: {},
      })
    })

    it('returns unknown for gibberish', () => {
      expect(parseCommand('asdfghjkl')).toEqual({
        command: 'unknown',
        rawText: 'asdfghjkl',
        params: {},
      })
    })
  })

  describe('case insensitivity', () => {
    it('handles "FOLLOWUP" (uppercase)', () => {
      expect(parseCommand('FOLLOWUP')).toEqual({
        command: 'followup',
        rawText: 'FOLLOWUP',
        params: {},
      })
    })

    it('handles "Who Owes" (mixed case)', () => {
      expect(parseCommand('Who Owes')).toEqual({
        command: 'status',
        rawText: 'Who Owes',
        params: {},
      })
    })

    it('handles "PAID INV-001" (uppercase)', () => {
      expect(parseCommand('PAID INV-001')).toEqual({
        command: 'mark_paid',
        rawText: 'PAID INV-001',
        params: { invoiceNumber: 'INV-001' },
      })
    })
  })

  describe('whitespace handling', () => {
    it('trims leading/trailing whitespace', () => {
      expect(parseCommand('  help  ')).toEqual({
        command: 'help',
        rawText: '  help  ',
        params: {},
      })
    })
  })
})

describe('getHelpText', () => {
  it('returns formatted help message with commands', () => {
    const help = getHelpText()
    expect(help).toContain('PayChase AI')
    expect(help).toContain('WHO OWES')
    expect(help).toContain('FOLLOWUP')
    expect(help).toContain('ADD CLIENT')
    expect(help).toContain('PAID')
    expect(help).toContain('STOP')
    expect(help).toContain('HELP')
  })

  it('includes examples section', () => {
    const help = getHelpText()
    expect(help).toContain('Examples')
    expect(help).toContain('who owes')
    expect(help).toContain('followup Acme Corp')
    expect(help).toContain('paid INV-001')
  })
})
