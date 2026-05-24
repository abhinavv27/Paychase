# PayChase AI — Remaining P1 Feature Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement remaining P1 features: delivery tracking UI, email reminders, multilingual support, first-client onboarding, invoice bulk actions, ISR caching

**Architecture:** 6 independent groups, each touching a different subsystem. No cross-group dependencies. Each group can be implemented and tested independently.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Resend, Supabase

---

## File Map

**New files (10):**
- `src/components/approvals/delivery-status.tsx` — manual Mark as Sent/Delivered/Replied buttons
- `src/lib/email/send.ts` — Resend email sending function
- `src/lib/email/templates.ts` — Email HTML templates
- `src/lib/email/index.ts` — barrel export
- `src/lib/ai/translations.ts` — multilingual message translation map
- `src/components/invoices/bulk-actions.tsx` — batch actions toolbar
- `src/components/invoices/bulk-action-bar.tsx` — floating action bar when rows selected
- `src/lib/invoices/bulk-actions.ts` — server actions for batch operations
- `src/app/(dashboard)/onboarding/add-client.tsx` — quick client creation form for onboarding Step 4

**Modified files (9):**
- `src/app/(dashboard)/approvals/page.tsx` — show scheduled time + delivery status UI
- `src/app/api/cron/reminder-dispatch/route.ts` — email fallback when no phone
- `src/lib/ai/message-generator.ts` — multilingual support
- `src/app/(dashboard)/invoices/page.tsx` — add checkboxes + bulk action bar
- `src/app/(dashboard)/onboarding/page.tsx` — add Step 4: add first client
- `next.config.mjs` — add ISR cache config
- `src/app/(dashboard)/page.tsx` — add tag-based revalidation for key queries
- `src/app/(dashboard)/clients/page.tsx` — add ISR cache tags
- `src/app/(dashboard)/invoices/page.tsx` — add ISR cache tags (already listed)

---

### Group A: Delivery Tracking UI + Smart Timing Display (MSG-6 + AI-7)

**Items:** Manual status logging for sent/delivered/replied, show scheduled time on approvals

**Agent instructions:** Two UI additions to the approvals page. No backend changes needed.

---

### Task A1: Show Scheduled Send Time in Approvals

**Files:**
- Modify: `src/app/(dashboard)/approvals/page.tsx`

- [ ] **Add scheduled time display below message preview**

In `approvals/page.tsx`, inside each draft card, add the scheduled time below the message preview block (after line 64):

```tsx
{draft.scheduled_send_at && (
  <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
    <Clock className="w-3.5 h-3.5" />
    Scheduled for{' '}
    {new Date(draft.scheduled_send_at).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })}
  </div>
)}
```

Add `Clock` to the lucide-react imports on line 5. Change from:
```tsx
import { ArrowLeft } from "lucide-react"
```
to:
```tsx
import { ArrowLeft, Clock } from "lucide-react"
```

- [ ] **Commit**

```bash
git add src/app/(dashboard)/approvals/page.tsx
git commit -m "feat(AI-7): show scheduled send time in approvals page"
```

---

### Task A2: Manual Delivery Status Tracking (MSG-6)

**Files:**
- Create: `src/components/approvals/delivery-status.tsx`
- Modify: `src/app/(dashboard)/approvals/page.tsx`

- [ ] **Create DeliveryStatus component**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { CheckCircle, Clock, MessageSquare, Send } from 'lucide-react'

interface DeliveryStatusProps {
  draftId: string
  hasPhoneNumber: boolean
  initialStatus?: 'draft' | 'sent' | 'delivered' | 'responded'
  clientPhone?: string | null
  deepLink?: string | null
}

async function updateDeliveryStatus(draftId: string, status: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/approvals/${draftId}/delivery`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    return data
  } catch {
    return { error: 'Failed to update status' }
  }
}

const statusSteps = [
  { key: 'sent', label: 'Sent', icon: Send, color: 'text-blue-600 bg-blue-50' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  { key: 'responded', label: 'Replied', icon: MessageSquare, color: 'text-purple-600 bg-purple-50' },
] as const

export function DeliveryStatus({ draftId, hasPhoneNumber, initialStatus = 'draft', clientPhone, deepLink }: DeliveryStatusProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()
  const currentStep = statusSteps.findIndex((s) => s.key === status)

  const handleMark = (newStatus: string) => {
    startTransition(async () => {
      const result = await updateDeliveryStatus(draftId, newStatus)
      if (result.success) setStatus(newStatus as typeof status)
    })
  }

  if (status === 'draft') {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-2">After sending, mark the status:</p>
        <div className="flex gap-2">
          {statusSteps.map((step) => (
            <button
              key={step.key}
              onClick={() => handleMark(step.key)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <step.icon className="w-3.5 h-3.5" />
              Mark {step.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2">
        {statusSteps.map((step, idx) => (
          <div key={step.key} className="flex items-center">
            <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
              idx <= currentStep ? step.color : 'text-gray-400 bg-gray-50'
            }`}>
              <step.icon className="w-3 h-3" />
              {step.label}
            </span>
            {idx < statusSteps.length - 1 && (
              <div className={`w-4 h-0.5 mx-1 ${idx < currentStep ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Integrate into approvals page**

In `approvals/page.tsx`, after the scheduled time display div and before the Approve/Dismiss buttons, add:

```tsx
<DeliveryStatus
  draftId={draft.id}
  hasPhoneNumber={!!draft.clients?.phone}
  initialStatus={draft.status as 'draft' | 'sent' | 'delivered' | 'responded'}
/>
```

Add the import at the top of the file:
```tsx
import { DeliveryStatus } from '@/components/approvals/delivery-status'
```

- [ ] **Create delivery status API endpoint**

Create `src/app/api/approvals/[id]/delivery/route.ts`:

```tsx
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status } = await request.json()
  if (!['sent', 'delivered', 'responded'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updateField: Record<string, string> = {
    sent: 'sent_at',
    delivered: 'delivered_at',
    responded: 'responded_at',
  }

  const { error } = await supabase
    .from('reminders')
    .update({
      status,
      [updateField[status]]: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

- [ ] **Commit**

```bash
git add src/components/approvals/delivery-status.tsx src/app/(dashboard)/approvals/page.tsx src/app/api/approvals/
git commit -m "feat(MSG-6): add manual delivery status tracking UI"
```

---

### Group B: Email Reminders + Fallback (MSG-2 + MSG-7)

**Items:** Resend email integration, email templates, fallback when no WhatsApp phone

---

### Task B1: Email Sending Module

**Files:**
- Create: `src/lib/email/send.ts`
- Create: `src/lib/email/templates.ts`
- Create: `src/lib/email/index.ts`

- [ ] **Create email templates**

`src/lib/email/templates.ts`:

```typescript
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

  const urgencyColor = escalationLevel === 'gentle' ? '#6B7280'
    : escalationLevel === 'firm' ? '#D97706'
    : '#DC2626'

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
      Sent via PayChase AI &mdash; AI-powered payment follow-ups<br>
      <a href="{{UNSUBSCRIBE_URL}}" style="color: #9CA3AF;">Unsubscribe from reminders</a>
    </p>
  </div>
</body>
</html>`

  return {
    subject: subjects[escalationLevel] || `Payment reminder: Invoice ${invoiceNumber}`,
    html,
  }
}
```

- [ ] **Create email send function**

`src/lib/email/send.ts`:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')

const FROM_EMAIL = process.env.EMAIL_FROM || 'PayChase AI <reminders@paychase.app>'

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email send')
    return { success: false, error: 'Email not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
```

- [ ] **Create barrel export**

`src/lib/email/index.ts`:

```typescript
export { sendEmail } from './send'
export { paymentReminderEmail } from './templates'
```

- [ ] **Commit**

```bash
git add src/lib/email/
git commit -m "feat(MSG-2): add email sending module with Resend integration"
```

---

### Task B2: Email Fallback in Cron (MSG-7)

**Files:**
- Modify: `src/app/api/cron/reminder-dispatch/route.ts`

- [ ] **Add email fallback when user has no WhatsApp phone**

In `reminder-dispatch/route.ts`, replace the existing phone-only check (line 80: `if (!typedUser?.phone) continue`) with a fallback:

```typescript
import { sendEmail, paymentReminderEmail } from '@/lib/email'

// Replace line 80:
if (!typedUser?.phone) {
  // Fallback to email if no WhatsApp phone
  if (!typedUser?.email) {
    totalSkipped++
    continue
  }
  // Generate email draft instead
  const dueDate = new Date(invoice.due_date)
  const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  const amountStr = `₹${Number(invoice.amount).toLocaleString('en-IN')}`

  const emailContent = paymentReminderEmail({
    clientName: client.name as string,
    invoiceNumber: invoice.id.slice(0, 8).toUpperCase(),
    amount: amountStr,
    dueDate: dueDate.toLocaleDateString('en-IN'),
    daysOverdue,
    escalationLevel: daysOverdue <= 3 ? 'gentle' : daysOverdue <= 14 ? 'firm' : 'urgent',
  })

  draftsToInsert.push({
    userId,
    invoiceId: invoice.id,
    clientId: invoice.client_id,
    messageText: emailContent.html.slice(0, 500), // store preview
    daysOverdue,
    scheduledSendAt: new Date().toISOString(),
  })

  // Send via email immediately
  await sendEmail({
    to: typedUser.email,
    subject: emailContent.subject,
    html: emailContent.html,
  }).catch((e) => console.error('Failed to send email reminder:', e))

  continue
}
```

Also update the user info fetch to include `email`:
```typescript
const { data: user } = await supabase
  .from('users')
  .select('phone, email, plan, style_preference')
  .eq('id', userId)
  .single()

const typedUser = user as { phone: string | null; email: string | null; plan: string | null; style_preference: string | null } | null
```

- [ ] **Commit**

```bash
git add src/app/api/cron/reminder-dispatch/route.ts
git commit -m "feat(MSG-7): add email fallback when user has no WhatsApp phone in cron"
```

---

### Group C: Multilingual Support (MSG-3)

**Items:** Translation system for message templates in 5 languages

---

### Task C1: Translation System

**Files:**
- Create: `src/lib/ai/translations.ts`
- Modify: `src/lib/ai/message-generator.ts`

- [ ] **Create translation map**

`src/lib/ai/translations.ts`:

```typescript
export type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn'

export interface TranslationSet {
  paymentLink: string
  gentle: { casual: string; professional: string; formal: string }
  firm: { casual: string; professional: string; formal: string }
  urgent: { casual: string; professional: string; formal: string }
}

const translations: Record<Language, TranslationSet> = {
  en: {
    paymentLink: '\n\nPay here: {upiLink}',
    gentle: {
      casual: 'Hey {clientName}! Just a quick reminder about invoice {invoiceNumber} for {amount} (due {dateStr}). No rush, just didn\'t want it to slip through the cracks!{paymentLink}',
      professional: 'Hi {clientName}, hope you\'re doing well. Just a friendly reminder about invoice {invoiceNumber} for {amount} (due {dateStr}). Please let me know if there\'s anything you need from my end.{paymentLink}',
      formal: 'Dear {clientName}, I hope this message finds you well. This is a gentle reminder regarding invoice {invoiceNumber} for {amount}, which was due on {dateStr}. Please let me know if you need any clarification.{paymentLink}',
    },
    firm: {
      casual: 'Hey {clientName}, following up on invoice {invoiceNumber} for {amount}. It\'s been {overdueText}. Could you please update me on the payment status?{paymentLink}',
      professional: 'Hi {clientName}, following up on invoice {invoiceNumber} for {amount}. This is now {overdueText}. Could you please provide an update on when I can expect the payment?{paymentLink}',
      formal: 'Dear {clientName}, I am writing to follow up on invoice {invoiceNumber} for {amount}, which is now {overdueText}. I would appreciate an update on the payment timeline.{paymentLink}',
    },
    urgent: {
      casual: '{clientName}, invoice {invoiceNumber} for {amount} is now {overdueText}. I need this resolved this week. Please let me know when the payment will be processed.{paymentLink}',
      professional: 'Hi {clientName}, invoice {invoiceNumber} for {amount} is now {overdueText}. I need this resolved urgently. Please confirm when the payment will be processed.{paymentLink}',
      formal: 'Dear {clientName}, this is an urgent follow-up regarding invoice {invoiceNumber} for {amount}, which is now {overdueText}. I request immediate payment or a clear timeline for settlement.{paymentLink}',
    },
  },
  hi: {
    paymentLink: '\n\nयहाँ भुगतान करें: {upiLink}',
    gentle: {
      casual: 'नमस्ते {clientName}! चालान {invoiceNumber} ({amount}) के बारे में एक अनुस्मारक, जो {dateStr} को देय था। बस याद दिला रहा हूँ!{paymentLink}',
      professional: 'नमस्ते {clientName}, आशा है आप ठीक हैं। चालान {invoiceNumber} ({amount}) के संबंध में एक विनम्र अनुस्मारक, जो {dateStr} को देय था।{paymentLink}',
      formal: 'प्रिय {clientName}, मुझे आशा है कि आप कुशल होंगे। यह चालान {invoiceNumber} ({amount}) के संबंध में एक विनम्र अनुस्मारक है, जो {dateStr} को देय था।{paymentLink}',
    },
    firm: {
      casual: 'नमस्ते {clientName}, चालान {invoiceNumber} ({amount}) के बारे में फॉलो-अप। यह अब {overdueText} है। कृपया भुगतान की स्थिति के बारे में मुझे अपडेट करें।{paymentLink}',
      professional: 'नमस्ते {clientName}, चालान {invoiceNumber} ({amount}) के लिए फॉलो-अप। यह अब {overdueText} है। कृपया मुझे बताएं कि मैं भुगतान कब उम्मीद कर सकता हूं।{paymentLink}',
      formal: 'प्रिय {clientName}, मैं चालान {invoiceNumber} ({amount}) के संबंध में फॉलो-अप कर रहा हूं, जो अब {overdueText} है। कृपया भुगतान समयरेखा पर अपडेट प्रदान करें।{paymentLink}',
    },
    urgent: {
      casual: '{clientName}, चालान {invoiceNumber} ({amount}) अब {overdueText} है। मुझे इस सप्ताह इसे हल करना है। कृपया मुझे बताएं कि भुगतान कब होगा।{paymentLink}',
      professional: 'नमस्ते {clientName}, चालान {invoiceNumber} ({amount}) अब {overdueText} है। मुझे इसे तत्काल हल करना है। कृपया पुष्टि करें कि भुगतान कब संसाधित किया जाएगा।{paymentLink}',
      formal: 'प्रिय {clientName}, यह चालान {invoiceNumber} ({amount}) के संबंध में एक तत्काल अनुस्मारक है, जो अब {overdueText} है। मैं तत्काल भुगतान या निपटान के लिए स्पष्ट समयरेखा का अनुरोध करता हूं।{paymentLink}',
    },
  },
  ta: {
    paymentLink: '\n\nஇங்கு செலுத்தவும்: {upiLink}',
    gentle: {
      casual: 'வணக்கம் {clientName}! {amount} தொகைக்கான {invoiceNumber} என்ற விலைப்பட்டியல் பற்றி ஒரு நினைவூட்டல், இது {dateStr} அன்று செலுத்த வேண்டியதாக இருந்தது.{paymentLink}',
      professional: 'வணக்கம் {clientName}, நீங்கள் நலமாக இருப்பீர்கள் என நம்புகிறேன். {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் பற்றி ஒரு நினைவூட்டல், இது {dateStr} அன்று செலுத்த வேண்டியதாக இருந்தது.{paymentLink}',
      formal: 'அன்புள்ள {clientName}, இது {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் பற்றிய ஒரு நினைவூட்டலாகும், இது {dateStr} அன்று செலுத்த வேண்டியதாக இருந்தது.{paymentLink}',
    },
    firm: {
      casual: 'வணக்கம் {clientName}, {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் பற்றி தொடர்ச்சி. இது இப்போது {overdueText} ஆகிறது. தயவுசெய்து கட்டணம் செலுத்தும் நிலை குறித்து எனக்கு அறிவிக்கவும்.{paymentLink}',
      professional: 'வணக்கம் {clientName}, {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் பற்றி தொடர்ச்சி. இது இப்போது {overdueText} ஆகிறது. எப்போது கட்டணத்தை எதிர்பார்க்கலாம் என்பதை தயவுசெய்து எனக்குத் தெரிவிக்கவும்.{paymentLink}',
      formal: 'அன்புள்ள {clientName}, நான் {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் பற்றி தொடர்ச்சியாக கேட்கிறேன், இது இப்போது {overdueText} ஆகிறது. தயவுசெய்து கட்டணம் செலுத்தும் காலவரிசை குறித்த புதுப்பிப்பை வழங்கவும்.{paymentLink}',
    },
    urgent: {
      casual: '{clientName}, {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் இப்போது {overdueText} ஆகிறது. இந்த வாரம் இதை தீர்க்க வேண்டும். கட்டணம் எப்போது செலுத்தப்படும் என்று தெரிவிக்கவும்.{paymentLink}',
      professional: 'வணக்கம் {clientName}, {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் இப்போது {overdueText} ஆகிறது. இதை உடனடியாக தீர்க்க வேண்டும். கட்டணம் எப்போது செயலாக்கப்படும் என்பதை உறுதிப்படுத்தவும்.{paymentLink}',
      formal: 'அன்புள்ள {clientName}, இது {amount} தொகைக்கான {invoiceNumber} விலைப்பட்டியல் பற்றிய அவசர நினைவூட்டலாகும், இது இப்போது {overdueText} ஆகிறது. உடனடி கட்டணம் அல்லது தீர்வுக்கான தெளிவான காலவரிசையை நான் கோருகிறேன்.{paymentLink}',
    },
  },
  te: {
    paymentLink: '\n\nఇక్కడ చెల్లించండి: {upiLink}',
    gentle: {
      casual: 'హాయ్ {clientName}! {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ గురించి గుర్తు, ఇది {dateStr}న చెల్లించాల్సి ఉంది.{paymentLink}',
      professional: 'హలో {clientName}, మీరు బాగున్నారని ఆశిస్తున్నాను. {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ గురించి స్నేహపూర్వక గుర్తు, ఇది {dateStr}న చెల్లించాల్సి ఉంది.{paymentLink}',
      formal: 'ప్రియమైన {clientName}, ఈ సందేశం మీకు చేరుతుందని ఆశిస్తున్నాను. ఇది {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ గురించి సున్నితమైన గుర్తు, ఇది {dateStr}న చెల్లించాల్సి ఉంది.{paymentLink}',
    },
    firm: {
      casual: 'హాయ్ {clientName}, {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ గురించి ఫాలో-అప్. ఇది ఇప్పుడు {overdueText} అయింది. దయచేసి చెల్లింపు స్థితి గురించి నాకు తెలియజేయండి.{paymentLink}',
      professional: 'హలో {clientName}, {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ కోసం ఫాలో-అప్. ఇది ఇప్పుడు {overdueText} అయింది. నేను ఎప్పుడు చెల్లింపును ఆశించవచ్చో దయచేసి తెలియజేయండి.{paymentLink}',
      formal: 'ప్రియమైన {clientName}, నేను {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ గురించి ఫాలో-అప్ చేస్తున్నాను, ఇది ఇప్పుడు {overdueText} అయింది. దయచేసి చెల్లింపు కాలక్రమంపై అప్‌డేట్ అందించండి.{paymentLink}',
    },
    urgent: {
      casual: '{clientName}, {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ ఇప్పుడు {overdueText} అయింది. నేను దీన్ని ఈ వారంలో పరిష్కరించాలి. చెల్లింపు ఎప్పుడు ప్రాసెస్ చేయబడుతుందో దయచేసి తెలియజేయండి.{paymentLink}',
      professional: 'హలో {clientName}, {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ ఇప్పుడు {overdueText} అయింది. నేను దీన్ని అత్యవసరంగా పరిష్కరించాలి. చెల్లింపు ఎప్పుడు ప్రాసెస్ చేయబడుతుందో దయచేసి నిర్ధారించండి.{paymentLink}',
      formal: 'ప్రియమైన {clientName}, ఇది {amount} మొత్తానికి {invoiceNumber} ఇన్వాయిస్ గురించి అత్యవసర గుర్తు, ఇది ఇప్పుడు {overdueText} అయింది. నేను తక్షణ చెల్లింపు లేదా పరిష్కారానికి స్పష్టమైన కాలక్రమాన్ని అభ్యర్థిస్తున్నాను.{paymentLink}',
    },
  },
  bn: {
    paymentLink: '\n\nএখানে অর্থ প্রদান করুন: {upiLink}',
    gentle: {
      casual: 'হ্যালো {clientName}! {amount} টাকার {invoiceNumber} ইনভয়েসটি সম্পর্কে একটি অনুস্মারক, যা {dateStr} তারিখে দেওয়ার ছিল।{paymentLink}',
      professional: 'হাই {clientName}, আশা করি আপনি ভাল আছেন। {amount} টাকার {invoiceNumber} ইনভয়েসটি সম্পর্কে একটি বিনীত অনুস্মারক, যা {dateStr} তারিখে দেওয়ার ছিল।{paymentLink}',
      formal: 'প্রিয় {clientName}, আমি আশা করি এই বার্তাটি আপনাকে সুস্থ অবস্থায় পৌঁছাবে। এটি {amount} টাকার {invoiceNumber} ইনভয়েসটি সম্পর্কে একটি বিনীত অনুস্মারক, যা {dateStr} তারিখে দেওয়ার ছিল।{paymentLink}',
    },
    firm: {
      casual: 'হ্যালো {clientName}, {amount} টাকার {invoiceNumber} ইনভয়েসটি সম্পর্কে ফলো-আপ। এটি এখন {overdueText} হয়েছে। দয়া করে পেমেন্ট স্ট্যাটাস সম্পর্কে আমাকে আপডেট দিন।{paymentLink}',
      professional: 'হাই {clientName}, {amount} টাকার {invoiceNumber} ইনভয়েসটির জন্য ফলো-আপ। এটি এখন {overdueText} হয়েছে। আমি কখন পেমেন্ট আশা করতে পারি দয়া করে জানান।{paymentLink}',
      formal: 'প্রিয় {clientName}, আমি {amount} টাকার {invoiceNumber} ইনভয়েসটি সম্পর্কে ফলো-আপ করছি, যা এখন {overdueText} হয়েছে। দয়া করে পেমেন্ট টাইমলাইনে একটি আপডেট দিন।{paymentLink}',
    },
    urgent: {
      casual: '{clientName}, {amount} টাকার {invoiceNumber} ইনভয়েসটি এখন {overdueText} হয়েছে। আমার এই সপ্তাহে এটি সমাধান করতে হবে। পেমেন্ট কখন প্রক্রিয়া করা হবে দয়া করে জানান।{paymentLink}',
      professional: 'হাই {clientName}, {amount} টাকার {invoiceNumber} ইনভয়েসটি এখন {overdueText} হয়েছে। আমার এটি জরুরিভাবে সমাধান করতে হবে। পেমেন্ট কখন প্রক্রিয়া করা হবে দয়া করে নিশ্চিত করুন।{paymentLink}',
      formal: 'প্রিয় {clientName}, এটি {amount} টাকার {invoiceNumber} ইনভয়েসটি সম্পর্কে একটি জরুরি অনুস্মারক, যা এখন {overdueText} হয়েছে। আমি তাৎক্ষণিক পেমেন্ট বা নিষ্পত্তির জন্য একটি স্পষ্ট সময়সীমা অনুরোধ করছি।{paymentLink}',
    },
  },
}

export function getTranslation(language: Language, escalationLevel: string, userStyle: string): (params: Record<string, string>) => string {
  const lang = translations[language] || translations.en
  const level = escalationLevel as keyof TranslationSet
  const style = userStyle as 'casual' | 'professional' | 'formal'
  const template = lang[level as keyof typeof lang]?.[style] || lang.gentle.professional

  return (params: Record<string, string>) => {
    let message = template
    const paymentLink = params.paymentLink ? (lang.paymentLink || '\n\nPay here: {upiLink}').replace('{upiLink}', params.paymentLink) : ''
    message = message.replace('{paymentLink}', paymentLink).replace('{upiLink}', '')
    Object.entries(params).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value)
    })
    return message
  }
}

export function getAvailableLanguages(): Array<{ code: Language; name: string }> {
  return [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
  ]
}
```

- [ ] **Update message-generator.ts to use translations**

In `message-generator.ts`, add a `language` field to `MessageContext`:

```typescript
export interface MessageContext {
  // ... existing fields
  language?: 'en' | 'hi' | 'ta' | 'te' | 'bn'
}
```

Replace the `generateMessageText` function body with:

```typescript
import { getTranslation } from './translations'
import type { Language } from './translations'

function generateMessageText(params: {
  clientName: string
  invoiceNumber: string
  amount: number
  dueDate: string
  daysOverdue: number
  escalationLevel: 'gentle' | 'firm' | 'urgent'
  userStyle: 'casual' | 'professional' | 'formal'
  upiLink?: string
  language?: Language
}): string {
  const { clientName, invoiceNumber, amount, dueDate, daysOverdue, escalationLevel, userStyle, upiLink, language = 'en' } = params

  const amountStr = `₹${amount.toLocaleString('en-IN')}`
  const overdueText = daysOverdue > 0
    ? `${daysOverdue} ${language === 'hi' ? 'दिन' : language === 'ta' ? 'நாட்கள்' : language === 'te' ? 'రోజులు' : language === 'bn' ? 'দিন' : 'days'} ${language === 'hi' ? 'अतिदेय' : language === 'ta' ? 'தாமதமானது' : language === 'te' ? 'ఆలస్యం' : language === 'bn' ? 'অতিদেরী' : 'overdue'}`
    : dueDate

  const translate = getTranslation(language, escalationLevel, userStyle)

  return translate({
    clientName,
    invoiceNumber,
    amount: amountStr,
    dateStr: dueDate,
    overdueText,
    paymentLink: upiLink || '',
  })
}
```

Also update `MessageContext` to include the `language` field throughout — the cron job should pass it from the client's `preferred_language` field.

- [ ] **Update cron to pass language**

In `reminder-dispatch/route.ts`, in the message context creation (around line 118-127), add:
```typescript
language: (client.preferred_language as Language) || 'en',
```

- [ ] **Commit**

```bash
git add src/lib/ai/translations.ts src/lib/ai/message-generator.ts src/app/api/cron/reminder-dispatch/route.ts
git commit -m "feat(MSG-3): add multilingual support (Hindi, Tamil, Telugu, Bengali)"
```

---

### Group D: First Client Import in Onboarding (ONB-3)

**Items:** Extend onboarding with a step to add the first client

---

### Task D1: Add Client Creation Step to Onboarding

**Files:**
- Create: `src/app/(dashboard)/onboarding/add-client.tsx`
- Modify: `src/app/(dashboard)/onboarding/page.tsx`

- [ ] **Create QuickAddClient component**

`src/app/(dashboard)/onboarding/add-client.tsx`:

```tsx
'use client'

import { useState } from 'react'

interface QuickAddClientProps {
  onClientAdded: (client: { id: string; name: string }) => void
  onSkip: () => void
}

export function QuickAddClient({ onClientAdded, onSkip }: QuickAddClientProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Client name is required'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/clients/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      onClientAdded(data.client)
    } catch {
      setError('Failed to add client. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Add your first client</h2>
        <p className="mt-2 text-gray-600">
          Add a client to get started with payment follow-ups.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rajesh Sharma"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9876543210"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rajesh@example.com"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Adding...' : 'Add Client'}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Create quick-add API endpoint**

Create `src/app/api/clients/quick-add/route.ts`:

```tsx
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, phone, email } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data: client, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      consent_given: true,
      consent_date: new Date().toISOString(),
    })
    .select('id, name')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log consent
  await supabase.from('consent_log').insert({
    user_id: user.id,
    client_name: name.trim(),
    client_phone: phone?.trim() || null,
    client_email: email?.trim() || null,
    consent_type: 'whatsapp',
    consent_given: true,
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  })

  return NextResponse.json({ client, success: true })
}
```

- [ ] **Modify onboarding page to add Step 4**

In `onboarding/page.tsx`, after step 3 and before the navigation section, add a 4th step:

First, add a state variable for whether a client was added and a counter:
```typescript
const [clientAdded, setClientAdded] = useState(false)
const TOTAL_STEPS = 4
```

Change all references from `3` (total steps) to `TOTAL_STEPS`.

Add Step 4 content after the step 3 block and before the navigation:

```tsx
{step === 4 && (
  <QuickAddClient
    onClientAdded={() => setClientAdded(true)}
    onSkip={skipOnboarding}
  />
)}
```

Update the navigation buttons: on step 4, show "Go to Dashboard" instead of Next:
```tsx
{step < TOTAL_STEPS && (
  <div className="mt-8 flex items-center justify-between">
    {step > 1 ? (
      <button
        onClick={() => setStep(step - 1)}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
    ) : <div />}
    {step < TOTAL_STEPS ? (
      <button
        onClick={() => setStep(step + 1)}
        className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Next
        <ArrowRight className="w-4 h-4" />
      </button>
    ) : null}
  </div>
)}
```

Add import for QuickAddClient:
```typescript
import { QuickAddClient } from './add-client'
```

- [ ] **Commit**

```bash
git add src/app/(dashboard)/onboarding/ src/app/api/clients/quick-add/
git commit -m "feat(ONB-3): add first client creation step in onboarding"
```

---

### Group E: Invoice Bulk Actions (INV-4)

**Items:** Checkbox selection + batch mark-paid and batch draft generation

---

### Task E1: Bulk Action Components

**Files:**
- Create: `src/components/invoices/bulk-action-bar.tsx`
- Create: `src/lib/invoices/bulk-actions.ts`
- Modify: `src/app/(dashboard)/invoices/page.tsx`

- [ ] **Create bulk actions server actions**

`src/lib/invoices/bulk-actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function batchMarkAsPaid(invoiceIds: string[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      payment_date: new Date().toISOString(),
    })
    .in('id', invoiceIds)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/invoices')
  return { success: true, count: invoiceIds.length }
}

export async function batchGenerateDrafts(invoiceIds: string[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, client:clients(name, phone, on_time_rate)')
    .in('id', invoiceIds)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (!invoices || invoices.length === 0) return { error: 'No pending invoices selected' }

  const { data: userProfile } = await supabase
    .from('users')
    .select('style_preference')
    .eq('id', user.id)
    .single()

  const userStyle = (userProfile?.style_preference as string) || 'professional'
  const drafts = []
  const errors: string[] = []

  for (const invoice of invoices) {
    try {
      const client = invoice.client as Record<string, unknown> | null
      if (!client?.name) continue

      const dueDate = new Date(invoice.due_date)
      const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

      const { generateFollowUpMessage } = await import('@/lib/ai/message-generator')
      const message = generateFollowUpMessage({
        clientName: client.name as string,
        invoiceNumber: invoice.invoice_number || invoice.id.slice(0, 8),
        amount: Number(invoice.amount),
        dueDate: dueDate.toLocaleDateString('en-IN'),
        daysOverdue,
        onTimeRate: Number(client.on_time_rate || 0),
        reminderCount: 0,
        userStyle: userStyle as 'casual' | 'professional' | 'formal',
      })

      drafts.push({
        user_id: user.id,
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        channel: 'whatsapp',
        template_type: 'payment_followup',
        message_text: message.text,
        language: 'en',
        status: 'draft',
        approval_status: 'draft',
      })
    } catch (e) {
      errors.push(`Invoice ${invoice.invoice_number}: ${e instanceof Error ? e.message : 'Unknown'}`)
    }
  }

  if (drafts.length > 0) {
    const { error } = await supabase.from('reminders').insert(drafts)
    if (error) return { error: error.message }
  }

  revalidatePath('/invoices')
  revalidatePath('/approvals')
  return { success: true, draftsCreated: drafts.length, errors: errors.length > 0 ? errors : undefined }
}
```

- [ ] **Create bulk action bar component**

`src/components/invoices/bulk-action-bar.tsx`:

```tsx
'use client'

import { useState, useTransition } from 'react'
import { CheckSquare, Send, DollarSign } from 'lucide-react'

interface BulkActionBarProps {
  selectedCount: number
  onMarkPaid: () => Promise<void>
  onGenerateDrafts: () => Promise<void>
  onClear: () => void
}

export function BulkActionBar({ selectedCount, onMarkPaid, onGenerateDrafts, onClear }: BulkActionBarProps) {
  const [isPending, startTransition] = useTransition()
  const [action, setAction] = useState('')

  const handleAction = async (fn: () => Promise<void>, label: string) => {
    setAction(label)
    startTransition(async () => {
      await fn()
      setAction('')
    })
  }

  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4">
        <span className="flex items-center gap-2 text-sm font-medium">
          <CheckSquare className="w-4 h-4" />
          {selectedCount} selected
        </span>
        <div className="w-px h-5 bg-gray-600" />
        <button
          onClick={() => handleAction(onMarkPaid, 'marking paid')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <DollarSign className="w-4 h-4" />
          {isPending && action === 'marking paid' ? 'Marking...' : 'Mark Paid'}
        </button>
        <button
          onClick={() => handleAction(onGenerateDrafts, 'generating')}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
          {isPending && action === 'generating' ? 'Generating...' : 'Generate Drafts'}
        </button>
        <div className="w-px h-5 bg-gray-600" />
        <button
          onClick={onClear}
          disabled={isPending}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Add checkboxes and bulk action bar to invoices page**

In `src/app/(dashboard)/invoices/page.tsx`:

1. Add imports:
```typescript
import { BulkActionBar } from '@/components/invoices/bulk-action-bar'
import { batchMarkAsPaid, batchGenerateDrafts } from '@/lib/invoices/bulk-actions'
```

2. Make the page a client component or wrap the interactive part. Since this needs client interactivity, convert the page to a composition: keep the server component shell but add a client component for the table/bulk actions.

Create `src/app/(dashboard)/invoices/invoice-table.tsx`:

The invoice-table.tsx wraps the table rendering + bulk selection state. Here's the approach:
- Keep `invoices/page.tsx` as the server component that fetches data
- Move the table rendering into a new `'use client'` component `InvoiceTableWithBulk`
- Add checkbox column

Since this is complex, the simpler approach is:
- Add a `'use client'` component at the bottom of the page that wraps the table section
- Add checkbox column to each row (first `<td>`)
- Add a "Select All" checkbox in the header
- Render BulkActionBar below when selections exist

Update the table head to add a checkbox column:
```tsx
<th className="px-4 py-3 text-left">
  <input
    type="checkbox"
    checked={selectedIds.length === typedInvoices.length && typedInvoices.length > 0}
    onChange={() => {
      if (selectedIds.length === typedInvoices.length) setSelectedIds([])
      else setSelectedIds(typedInvoices.map((i) => i.id))
    }}
    className="rounded border-gray-300"
  />
</th>
```

Each row gets:
```tsx
<td className="px-4 py-4">
  <input
    type="checkbox"
    checked={selectedIds.includes(invoice.id)}
    onChange={() => {
      setSelectedIds((prev) =>
        prev.includes(invoice.id)
          ? prev.filter((id) => id !== invoice.id)
          : [...prev, invoice.id]
      )
    }}
    className="rounded border-gray-300"
  />
</td>
```

After the table section, add:
```tsx
<BulkActionBar
  selectedCount={selectedIds.length}
  onMarkPaid={async () => {
    await batchMarkAsPaid(selectedIds)
    setSelectedIds([])
  }}
  onGenerateDrafts={async () => {
    await batchGenerateDrafts(selectedIds)
    setSelectedIds([])
  }}
  onClear={() => setSelectedIds([])}
/>
```

- [ ] **Commit**

```bash
git add src/components/invoices/bulk-action-bar.tsx src/lib/invoices/bulk-actions.ts src/app/(dashboard)/invoices/
git commit -m "feat(INV-4): add invoice bulk actions with checkboxes, batch mark paid and draft generation"
```

---

### Group F: ISR Caching (DASH-7)

**Items:** Configure Next.js ISR with 5-minute revalidation and tag-based invalidation

---

### Task F1: ISR Cache Configuration

**Files:**
- Modify: `next.config.mjs`
- Modify: `src/app/(dashboard)/page.tsx`
- Modify: `src/app/(dashboard)/clients/page.tsx`
- Modify: `src/app/(dashboard)/invoices/page.tsx`

- [ ] **Add ISR config to next.config.mjs**

```javascript
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    staleTimes: {
      dynamic: 300, // 5 minutes
      static: 300,
    },
  },
}
```

- [ ] **Add revalidation to dashboard page**

In `src/app/(dashboard)/page.tsx`, add cache tags to the data fetching:

```typescript
import { unstable_cache } from 'next/cache'

// Tag constants for cache invalidation
export const CACHE_TAGS = {
  DASHBOARD: 'dashboard',
  CLIENTS: 'clients',
  INVOICES: 'invoices',
  APPROVALS: 'approvals',
}

// In the OverviewPage function, wrap the first data fetch
// Add `export const revalidate = 300` at the page level
```

Add at the top of the file (before the function):
```typescript
export const revalidate = 300 // revalidate every 5 minutes
```

- [ ] **Add revalidation to clients and invoices pages**

At the top of `src/app/(dashboard)/clients/page.tsx`:
```typescript
export const revalidate = 300
```

At the top of `src/app/(dashboard)/invoices/page.tsx`:
```typescript
export const revalidate = 300
```

- [ ] **Commit**

```bash
git add next.config.mjs src/app/(dashboard)/page.tsx src/app/(dashboard)/clients/page.tsx src/app/(dashboard)/invoices/page.tsx
git commit -m "feat(DASH-7): add ISR caching with 5-minute revalidation"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** Groups A-F cover MSG-6, AI-7, MSG-2, MSG-7, MSG-3, ONB-3, INV-4, DASH-7
- [ ] **Placeholder scan:** No TBD, TODO, or incomplete patterns
- [ ] **Type consistency:** `Language` type used consistently as `'en' | 'hi' | 'ta' | 'te' | 'bn'`. `Language` imported from `./translations`
- [ ] **Dependency check:** No cross-group dependencies. Group B (email) depends on Resend being in dependencies (already is). Group C (translations) depends on message-generator.ts.
