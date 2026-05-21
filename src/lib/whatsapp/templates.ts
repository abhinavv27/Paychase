export function buildReminderTemplate(params: {
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  daysOverdue: number
  upiLink?: string
}): Array<{
  type: string
  parameters: Array<{ type: string; text: string }>
}> {
  const { clientName, invoiceNumber, amount, dueDate, daysOverdue, upiLink } = params

  const bodyParams = [
    { type: 'text', text: clientName },
    { type: 'text', text: invoiceNumber },
    { type: 'text', text: `₹${amount}` },
    { type: 'text', text: daysOverdue > 0 ? `${daysOverdue} days overdue` : `due ${dueDate}` },
  ]

  if (upiLink) {
    bodyParams.push({ type: 'text', text: upiLink })
  }

  return [
    {
      type: 'body',
      parameters: bodyParams,
    },
  ]
}
