export function paymentReminderEmail(params: {
  clientName: string
  invoiceNumber: string
  amount: string
  dueDate: string
  daysOverdue: number
  escalationLevel: string
  upiLink?: string
}): { subject: string; html: string } {
  const { clientName, invoiceNumber, amount, dueDate, daysOverdue, escalationLevel, upiLink } = params

  const subjects: Record<string, string> = {
    gentle: `Gentle reminder: Invoice ${invoiceNumber}`,
    firm: `Follow-up: Invoice ${invoiceNumber}`,
    urgent: `Urgent: Outstanding payment for Invoice ${invoiceNumber}`,
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">PayChase AI</h1>
  </div>
  <div style="border: 1px solid #E5E7EB; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">Hi ${clientName},</p>
    <p style="color: #374151; font-size: 15px; line-height: 1.6;">
      This is a ${escalationLevel} reminder regarding invoice <strong>${invoiceNumber}</strong> for <strong>${amount}</strong>,
      due on ${dueDate}${daysOverdue > 0 ? ` (${daysOverdue} days overdue)` : ''}.
    </p>
    ${upiLink ? `<p style="text-align: center; margin: 24px 0;">
      <a href="${upiLink}" style="display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Pay Now</a>
    </p>` : ''}
    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
    <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5;">
      Sent via PayChase AI &mdash; AI-powered payment follow-ups
    </p>
  </div>
</body>
</html>`

  return {
    subject: subjects[escalationLevel] || `Payment reminder: Invoice ${invoiceNumber}`,
    html,
  }
}
