export interface ParsedCommand {
  command: 'help' | 'status' | 'followup' | 'followup_specific' | 'add_client' | 'mark_paid' | 'stop' | 'unknown'
  rawText: string
  params: {
    clientName?: string
    phone?: string
    amount?: number
    dueDate?: string
    invoiceNumber?: string
  }
}

export function parseCommand(message: string): ParsedCommand {
  const text = message.trim().toLowerCase()
  const original = message.trim()

  // Help
  if (/^(help|menu|h|\?)$/.test(text)) {
    return { command: 'help', rawText: message, params: {} }
  }

  // Status / Who owes
  if (/^(who owes|status|overdue|outstanding|who owes me|balance)\b/.test(text)) {
    return { command: 'status', rawText: message, params: {} }
  }

  // Follow-up all
  if (/^(followup|send|chase|remind|follow up|follow-up)\b$/.test(text)) {
    return { command: 'followup', rawText: message, params: {} }
  }

  // Follow-up specific client
  const followupMatch = text.match(/^(followup|send|chase|remind|follow up|follow-up)\s+(.+)$/)
  if (followupMatch) {
    const originalMatch = original.match(/^(?:followup|send|chase|remind|follow up|follow-up)\s+(.+)$/i)
    return {
      command: 'followup_specific',
      rawText: message,
      params: { clientName: originalMatch ? originalMatch[1].trim() : followupMatch[2].trim() },
    }
  }

  // Add client
  const addMatch = text.match(/^add\s+(client|customer)\s+(.+)$/)
  if (addMatch) {
    const originalAddMatch = original.match(/^add\s+(?:client|customer)\s+(.+)$/i)
    const parts = originalAddMatch ? originalAddMatch[1].split(/\s+/) : addMatch[2].split(/\s+/)
    // Format: add client NAME PHONE AMOUNT DUE_DATE
    // e.g., "add client Acme Corp 9876543210 50000 2026-06-15"
    const dueDateMatch = parts[parts.length - 1].match(/^\d{4}-\d{2}-\d{2}$/)
    const amountMatch = parts[parts.length - 2].match(/^\d+$/)

    let dueDate: string | undefined
    let amount: number | undefined
    let phone: string | undefined
    let name: string

    if (dueDateMatch) {
      dueDate = parts.pop()!
    }
    if (amountMatch) {
      amount = parseInt(parts.pop()!)
    }
    // Next-to-last could be phone
    const phoneCheck = parts[parts.length - 1].match(/^\d{10}$/)
    if (phoneCheck) {
      phone = parts.pop()!
    }

    name = parts.join(' ')

    return {
      command: 'add_client',
      rawText: message,
      params: { clientName: name, phone, amount, dueDate },
    }
  }

  // Mark paid
  const paidMatch = text.match(/^(paid|received|collected)\s+(.+)$/)
  if (paidMatch) {
    const originalPaidMatch = original.match(/^(?:paid|received|collected)\s+(.+)$/i)
    return {
      command: 'mark_paid',
      rawText: message,
      params: { invoiceNumber: originalPaidMatch ? originalPaidMatch[1].trim() : paidMatch[2].trim() },
    }
  }

  // Stop
  if (/^(stop|pause|mute|quiet)\b/.test(text)) {
    return { command: 'stop', rawText: message, params: {} }
  }

  // Unknown
  return { command: 'unknown', rawText: message, params: {} }
}

export function getHelpText(): string {
  return `*PayChase AI* — Your payment collection assistant

*Commands:*
• *WHO OWES* — See who hasn't paid
• *FOLLOWUP* — Send reminders to all overdue clients
• *FOLLOWUP [name]* — Send reminder to specific client
• *ADD CLIENT [name] [phone] [amount] [due date]* — Add new invoice
• *PAID [invoice #]* — Mark invoice as paid
• *STOP* — Pause notifications
• *HELP* — Show this menu

*Examples:*
• "who owes"
• "followup"
• "followup Acme Corp"
• "add client DesignCo 9876543210 50000 2026-06-15"
• "paid INV-001"`
}
