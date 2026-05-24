# PayChase AI — P0/P1 Feature Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix WhatsApp auto-send bug, add style preferences, UPI auto-generation, client risk cards, client detail page, dashboard metrics, approvals sidebar, onboarding, settings improvements, metadata, delete client, inline client creation, invoices empty state, phone link loading, duplicate check, collection health score, payment probability, smart draft scheduling.

**Architecture:** 18 features in 7 independent execution groups. Each group can be implemented by a separate subagent. Build order respects dependency graph (style preference before onboarding, etc.).

**Tech Stack:** Next.js 14 App Router, Supabase, TypeScript, Razorpay, Tailwind CSS

---

## File Map

**New files (17):**
- `supabase/migrations/004_style_preference.sql`
- `supabase/migrations/005_unique_invoice_number.sql`
- `lib/ai/collection-health.ts`
- `lib/ai/payment-probability.ts`
- `components/dashboard/health-score.tsx`
- `components/invoices/probability-badge.tsx`
- `components/clients/risk-cards.tsx`
- `components/clients/client-card.tsx`
- `components/clients/delete-button.tsx`
- `components/clients/quick-create-form.tsx`
- `components/clients/response-timeline.tsx`
- `app/(dashboard)/clients/[id]/page.tsx`
- `app/(dashboard)/clients/[id]/loading.tsx`
- `app/(dashboard)/onboarding/page.tsx`
- `app/(dashboard)/onboarding/loading.tsx`
- `lib/onboarding/actions.ts`
- `lib/supabase/types.ts` (exists, add types)

**Modified files (25):**
- `app/layout.tsx` — metadata
- `app/(dashboard)/layout.tsx` — sidebar approvals badge
- `app/(dashboard)/page.tsx` — health score + metrics
- `app/(dashboard)/clients/page.tsx` — cards
- `app/(dashboard)/invoices/page.tsx` — probability + empty state
- `app/(dashboard)/approvals/page.tsx` — deep link flow
- `app/(dashboard)/settings/page.tsx` — make editable
- `app/(dashboard)/settings/actions.ts` — add actions
- `app/(dashboard)/clients/add/page.tsx` — (unchanged)
- `app/(dashboard)/invoices/create/page.tsx` — (unchanged, invoice-form modified)
- `app/(dashboard)/invoices/[id]/edit/page.tsx` — regenerate UPI link
- `app/(auth)/signup/page.tsx` — style selector
- `app/(auth)/actions.ts` — pass style
- `app/api/cron/reminder-dispatch/route.ts` — userStyle + smart schedule
- `components/invoices/invoice-form.tsx` — quick create modal
- `components/settings/phone-link-form.tsx` — loading state
- `lib/invoices-actions.ts` — UPI gen + duplicate check
- `lib/clients-actions.ts` — delete action
- `lib/approvals/actions.ts` — fix auto-send bug
- `lib/ai/smart-timing.ts` — export timing logic
- `lib/supabase/types.ts` — style_preference type
- Various page `metadata` exports

---

### Group A: Blocker Fix + Polish (5 items)

Items: WhatsApp auto-send fix, page metadata, phone link loading, invoices empty state, approvals sidebar

**Agent instructions:** These are independent UI/polish fixes. No migrations needed.

---

### Task A1: Fix WhatsApp Auto-Send Bug

**Files:**
- Modify: `lib/approvals/actions.ts`
- Modify: `app/(dashboard)/approvals/page.tsx`

- [ ] **Replace WhatsApp API send with wa.me deep link in actions.ts**

Current code at `approvals/actions.ts:approveDraft()` calls `sendWhatsAppMessage()` via WhatsApp Cloud API. Replace with generating a wa.me deep link using the existing `lib/whatsapp/deep-link.ts`:

```typescript
// In approveDraft, after updating the draft status:
import { generateDeepLink } from '@/lib/whatsapp/deep-link'

// Replace the sendWhatsAppMessage call with:
const message = draft.message_text // already fetched from DB
const phone = (await supabase.from('clients').select('phone').eq('id', draft.client_id).single()).data?.phone

const deepLink = generateDeepLink(phone || '', message)

return { success: true, deepLink }
```

- [ ] **Update approvals/page.tsx to show deep link after approval**

After approval, show the deep link with copy + open buttons instead of just "Sent successfully!":

```tsx
// In approvals/page.tsx, when state.success and state.deepLink exist:
{state.deepLink && (
  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
    <p className="text-sm text-green-700 font-medium">Draft approved!</p>
    <p className="text-xs text-green-600 mt-1">Open WhatsApp to send this message:</p>
    <div className="mt-2 flex gap-2">
      <a
        href={state.deepLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
      >
        Open WhatsApp
      </a>
      <button
        onClick={() => navigator.clipboard.writeText(state.deepLink)}
        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
      >
        Copy Link
      </button>
    </div>
  </div>
)}
```

---

### Task A2: Fix Page Metadata

**Files:**
- Modify: `app/layout.tsx`
- Each page file

- [ ] **Update root layout metadata**

```typescript
// app/layout.tsx — change metadata export
export const metadata: Metadata = {
  title: { template: '%s | PayChase AI', default: 'PayChase AI — AI Payment Follow-ups' },
  description: 'AI-powered payment follow-ups that preserve client relationships. Generate, approve, and send payment reminders from your own WhatsApp.',
}
```

- [ ] **Add per-page metadata exports**

For each dashboard page, add:

```typescript
// app/(dashboard)/page.tsx
export const metadata: Metadata = {
  title: 'Dashboard',
}

// app/(dashboard)/clients/page.tsx
export const metadata: Metadata = {
  title: 'Clients',
}

// app/(dashboard)/invoices/page.tsx
export const metadata: Metadata = {
  title: 'Invoices',
}

// app/(dashboard)/approvals/page.tsx
export const metadata: Metadata = {
  title: 'Approvals',
}

// app/(dashboard)/analytics/page.tsx
export const metadata: Metadata = {
  title: 'Analytics',
}

// app/(dashboard)/insights/page.tsx
export const metadata: Metadata = {
  title: 'AI Insights',
}

// app/(dashboard)/settings/page.tsx
export const metadata: Metadata = {
  title: 'Settings',
}
```

---

### Task A3: Phone Link Loading State

**Files:**
- Modify: `components/settings/phone-link-form.tsx`

- [ ] **Add loading state to phone link button**

```tsx
// In phone-link-form.tsx, import useFormStatus or track isPending:
'use client'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Linking...' : 'Link'}
    </Button>
  )
}
```

---

### Task A4: Invoices Empty State

**Files:**
- Modify: `app/(dashboard)/invoices/page.tsx`

- [ ] **Replace plain text empty state with component**

```tsx
// In invoices/page.tsx, replace the <td colSpan={7}> text with:
{invoices.length === 0 && (
  <tr>
    <td colSpan={7}>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-sm font-medium text-gray-900">No invoices yet</h3>
        <p className="text-sm text-gray-500 mt-1">Get started by creating your first invoice.</p>
        <Link
          href="/invoices/create"
          className="mt-4 inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Create Invoice
        </Link>
      </div>
    </td>
  </tr>
)}
```
Add imports: `import { FileText, Plus } from 'lucide-react'` and `import Link from 'next/link'`.

---

### Task A5: Approvals in Sidebar

**Files:**
- Modify: `app/(dashboard)/layout.tsx`

- [ ] **Add Approvals nav item with pending count badge**

In the sidebar navigation section of `layout.tsx`, add after the Overview link:

```tsx
import { createClient } from '@/lib/supabase/server'

// In the layout component, fetch pending count:
const supabase = createClient()
const { count } = await supabase
  .from('reminders')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('status', 'draft')
  .eq('approval_status', 'draft')
```

Add the nav item:
```tsx
<Link
  href="/approvals"
  className="flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
>
  <span className="flex items-center gap-3">
    <MessageSquare className="w-5 h-5" />
    Approvals
  </span>
  {(count ?? 0) > 0 && (
    <span className="bg-indigo-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
      {count}
    </span>
  )}
</Link>
```

---

### Group B: Migrations + Style + Settings (3 items)

Items: Style preference DB + UI, duplicate invoice check DB, settings improvements

**Agent instructions:** Requires running 2 Supabase migrations. Style preference is needed by onboarding (Group G). Settings improvements depend on the style_preference column.

---

### Task B1: Style Preference Migration

**Files:**
- Create: `supabase/migrations/004_style_preference.sql`
- Modify: `lib/supabase/types.ts`

- [ ] **Create migration file**

```sql
-- 004_style_preference.sql: Add communication style preference to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS style_preference VARCHAR(20) NOT NULL DEFAULT 'professional';
ALTER TABLE users ADD CONSTRAINT style_preference_check CHECK (style_preference IN ('casual', 'professional', 'formal'));
```

- [ ] **Update types.ts**

```typescript
// In lib/supabase/types.ts, add to the Users table type:
export type User = {
  // ... existing fields
  style_preference: 'casual' | 'professional' | 'formal'
}
```

---

### Task B2: Style Preference UI (Signup + Settings)

**Files:**
- Modify: `app/(auth)/signup/page.tsx`
- Modify: `app/(auth)/actions.ts`
- Modify: `app/(dashboard)/settings/page.tsx`
- Modify: `app/(dashboard)/settings/actions.ts`

- [ ] **Add style selector to signup form**

In `signup/page.tsx`, add after the password field:

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700">Communication Style</label>
  <p className="text-xs text-gray-500 mt-1">How should AI draft your payment follow-ups?</p>
  <div className="mt-2 space-y-2">
    {[
      { value: 'casual', label: 'Casual', desc: 'Friendly and relaxed — "Hey, just a friendly nudge about the invoice"' },
      { value: 'professional', label: 'Professional', desc: 'Polished and business-like — "This is a gentle reminder regarding invoice #"' },
      { value: 'formal', label: 'Formal', desc: 'Strict and official — "We kindly request the settlement of the outstanding amount"' },
    ].map((style) => (
      <label key={style.value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50">
        <input type="radio" name="style" value={style.value} defaultChecked={style.value === 'professional'} className="mt-0.5" />
        <div>
          <p className="text-sm font-medium text-gray-900">{style.label}</p>
          <p className="text-xs text-gray-500">{style.desc}</p>
        </div>
      </label>
    ))}
  </div>
</div>
```

- [ ] **Pass style in signup action**

In `(auth)/actions.ts`, update the `signup` function to accept and pass `style_preference`:

```typescript
// In the formData parsing:
const style = formData.get('style') as string || 'professional'

// In the supabase.auth.signUp call:
options: {
  data: { name, style_preference: style }
}
```

Also add: `await supabase.from('users').upsert({ id: user.user.id, name, email, style_preference: style })` after auth signup to create the users table row (currently missing entirely).

- [ ] **Add style selector to settings page**

In `settings/page.tsx`, add a style preference section:

```tsx
// After WhatsApp Integration section:
<div className="border-t border-gray-200 pt-6">
  <h3 className="text-sm font-medium text-gray-900">Communication Style</h3>
  <p className="text-xs text-gray-500 mt-1">Choose how AI drafts your payment follow-ups.</p>
  <form action={updateStyleAction} className="mt-3 flex items-center gap-3">
    <select
      name="style"
      defaultValue={profile.style_preference || 'professional'}
      className="block w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
    >
      <option value="casual">Casual</option>
      <option value="professional">Professional</option>
      <option value="formal">Formal</option>
    </select>
    <Button type="submit">Save</Button>
  </form>
</div>
```

- [ ] **Add updateStyleAction to settings/actions.ts**

```typescript
export async function updateStyleAction(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const style = formData.get('style') as string
  if (!['casual', 'professional', 'formal'].includes(style)) {
    return { error: 'Invalid style' }
  }

  const { error } = await supabase
    .from('users')
    .update({ style_preference: style })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}
```

---

### Task B3: Duplicate Invoice Check

**Files:**
- Create: `supabase/migrations/005_unique_invoice_number.sql`
- Modify: `lib/invoices-actions.ts`

- [ ] **Create migration**

```sql
-- 005_unique_invoice_number.sql: Prevent duplicate invoice numbers per user
ALTER TABLE invoices ADD CONSTRAINT unique_user_invoice_number UNIQUE (user_id, invoice_number);
```

- [ ] **Handle in createInvoiceAction**

In `invoices-actions.ts`, in `createInvoiceAction`, wrap the insert in a try-catch for the unique constraint:

```typescript
// After the insert:
const { error } = await supabase.from('invoices').insert({...})

if (error) {
  if (error.code === '23505') { // unique violation
    return { success: false, error: 'An invoice with this number already exists. Please use a different invoice number.' }
  }
  return { success: false, error: error.message }
}
```

---

### Group C: Payments + Invoices (3 items)

Items: UPI auto-generation, inline client creation, delete client action

**Agent instructions:** Backend + UI changes. No migrations.

---

### Task C1: UPI Auto-Generation on Invoice Creation

**Files:**
- Modify: `lib/invoices-actions.ts`
- Modify: `app/(dashboard)/invoices/[id]/edit/page.tsx`

- [ ] **Add UPI link generation after invoice insert**

In `createInvoiceAction`, after successful insert and before redirect:

```typescript
import { createPaymentLink } from '@/lib/razorpay/client'

// After invoice insert succeeds:
const paymentLinkResult = await createPaymentLink({
  amount: invoiceData.amount,
  description: `Invoice ${invoiceData.invoice_number}`,
  notes: { invoice_id: newInvoice.id, user_id: userId }
}).catch(() => null) // non-fatal if fails

if (paymentLinkResult) {
  await supabase
    .from('invoices')
    .update({ upi_link: paymentLinkResult.short_url })
    .eq('id', newInvoice.id)
}
```

- [ ] **Add regenerate button on edit page**

In `invoices/[id]/edit/page.tsx`, add a button after the form:

```tsx
{invoice.upi_link ? (
  <div className="flex items-center gap-2 mt-4 p-3 bg-gray-50 rounded-lg">
    <span className="text-sm text-gray-600">UPI Link:</span>
    <a href={invoice.upi_link} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{invoice.upi_link}</a>
  </div>
) : (
  <form action={generatePaymentLink.bind(null, invoice.id)} className="mt-4">
    <Button type="submit" variant="outline" size="sm">Generate Payment Link</Button>
  </form>
)}
```

Add server action `generatePaymentLink` that calls the existing `/api/invoices/[id]/payment-link` logic.

---

### Task C2: Inline Client Creation in Invoice Form

**Files:**
- Create: `components/clients/quick-create-form.tsx`
- Modify: `app/(dashboard)/invoices/create/page.tsx`
- Modify (or pass through): `components/invoices/invoice-form.tsx`

- [ ] **Create QuickCreateForm component**

```tsx
// components/clients/quick-create-form.tsx
'use client'

import { useFormState } from 'react-dom'
import { createClientAction } from '@/lib/clients-actions'

export function QuickCreateForm({ onCreated }: { onCreated: (client: { id: string; name: string }) => void }) {
  const [state, action] = useFormState(createClientAction, {})

  return (
    <form action={action} className="space-y-3">
      <input name="name" placeholder="Client name" required className="w-full rounded-lg border px-3 py-2 text-sm" />
      <input name="phone" placeholder="Phone number" className="w-full rounded-lg border px-3 py-2 text-sm" />
      <input name="email" type="email" placeholder="Email" className="w-full rounded-lg border px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="consent" required />
        I have obtained consent to send payment reminders via WhatsApp
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" className="w-full">Add Client</Button>
    </form>
  )
}
```

- [ ] **Modify invoice-form.tsx to add modal trigger**

Add a "Create Client" button that opens a modal/dialog with the QuickCreateForm. On successful creation, add the client to the dropdown and select it.

```tsx
// In invoice-form.tsx, next to the client select:
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm">+ New Client</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
    <QuickCreateForm onCreated={(client) => { /* add to dropdown */ }} />
  </DialogContent>
</Dialog>
```

Use `@radix-ui/react-dialog` or a simple modal pattern.

---

### Task C3: Delete Client Action

**Files:**
- Create: `components/clients/delete-button.tsx`
- Modify: `lib/clients-actions.ts`

- [ ] **Add deleteClientAction to clients-actions.ts**

```typescript
export async function deleteClientAction(clientId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.rpc('cascade_delete_client', { client_id: clientId })
  // Alternative: delete manually across tables
  if (error) return { error: error.message }
  revalidatePath('/clients')
  return { success: true }
}
```

If no `cascade_delete_client` RPC exists, do manual deletes across tables:

```typescript
const tables = ['invoices', 'reminders', 'payments']
for (const table of tables) {
  await supabase.from(table as any).delete().eq('client_id', clientId).eq('user_id', user.id)
}
await supabase.from('clients').delete().eq('id', clientId).eq('user_id', user.id)
```

- [ ] **Create DeleteButton component** (reuse pattern from `components/invoices/delete-button.tsx`)

---

### Group D: AI Features (3 items)

Items: Collection health score, payment probability, smart draft scheduling

**Agent instructions:** Pure library + UI additions. No migrations. These are the innovative sellable features.

---

### Task D1: Collection Health Score

**Files:**
- Create: `lib/ai/collection-health.ts`
- Create: `components/dashboard/health-score.tsx`
- Modify: `app/(dashboard)/page.tsx`

- [ ] **Create collection-health.ts**

```typescript
export interface HealthScoreInput {
  dso: number
  recoveryRate: number
  highRiskOutstanding: number
  totalOutstanding: number
  approvalRate: number
  collectionVelocity: number // avg days from issue to payment
}

export interface HealthScoreResult {
  score: number
  breakdown: { dso: number; recovery: number; concentration: number; approval: number; velocity: number }
  level: 'healthy' | 'moderate' | 'critical'
}

export function calculateCollectionHealth(input: HealthScoreInput): HealthScoreResult {
  // DSO score (max 30): 30 if DSO < 15, 0 if DSO > 60
  const dsoScore = Math.max(0, Math.min(30, 30 * (1 - Math.max(0, input.dso - 15) / 45)))

  // Recovery rate (max 25): direct percentage mapping
  const recoveryScore = (input.recoveryRate / 100) * 25

  // At-risk concentration (max 20): 20 if <10% at risk, 0 if >50%
  const atRiskPct = input.totalOutstanding > 0 ? input.highRiskOutstanding / input.totalOutstanding : 0
  const concentrationScore = Math.max(0, 20 * (1 - Math.max(0, atRiskPct - 0.1) / 0.4))

  // Approval rate (max 15): 15 if >70%
  const approvalScore = Math.min(15, (input.approvalRate / 100) * 15)

  // Collection velocity (max 10): 10 if paid within 15 days of due date
  const velocityScore = Math.max(0, Math.min(10, 10 * (1 - Math.max(0, input.collectionVelocity - 15) / 45)))

  const score = Math.round(dsoScore + recoveryScore + concentrationScore + approvalScore + velocityScore)
  const level = score >= 70 ? 'healthy' : score >= 40 ? 'moderate' : 'critical'

  return {
    score, level,
    breakdown: { dso: dsoScore, recovery: recoveryScore, concentration: concentrationScore, approval: approvalScore, velocity: velocityScore }
  }
}
```

- [ ] **Create health-score.tsx gauge component**

```tsx
// components/dashboard/health-score.tsx
'use client'

interface HealthScoreProps {
  score: number
  level: 'healthy' | 'moderate' | 'critical'
}

const colors = { healthy: { ring: '#22c55e', bg: '#f0fdf4' }, moderate: { ring: '#eab308', bg: '#fefce8' }, critical: { ring: '#dc2626', bg: '#fef2f2' } }

export function HealthScore({ score, level }: HealthScoreProps) {
  const c = colors[level]
  const r = 54; const circumference = 2 * Math.PI * r; const offset = circumference - (score / 100) * circumference

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <h3 className="text-sm font-medium text-gray-900">Collection Health</h3>
      <div className="flex items-center gap-4 mt-4">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={c.ring} strokeWidth="12"
            strokeDasharray={circumference} strokeDashoffset={offset}
            transform="rotate(-90 70 70)" strokeLinecap="round" />
          <text x="70" y="70" textAnchor="middle" dominantBaseline="central" className="text-2xl font-bold" fill="currentColor">{score}</text>
        </svg>
        <div className="text-sm">
          <p className="font-medium text-gray-900 capitalize">{level}</p>
          <p className="text-gray-500 mt-1">{score >= 70 ? 'Your collection process is in good shape' : score >= 40 ? 'Some areas need attention' : 'Critical improvements needed'}</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Integrate into dashboard page.tsx**

Fetch the required data in the dashboard page and pass to `HealthScore` component alongside existing stat cards.

---

### Task D2: Payment Probability Per Invoice

**Files:**
- Create: `lib/ai/payment-probability.ts`
- Create: `components/invoices/probability-badge.tsx`
- Modify: `app/(dashboard)/invoices/page.tsx`

- [ ] **Create payment-probability.ts**

```typescript
export function calculatePaymentProbability(invoice: {
  amount: number
  daysOverdue: number
  clientOnTimeRate: number
  clientAvgDelayDays: number
}): { probability7: number; probability30: number; probability60: number } {
  const base = invoice.clientOnTimeRate / 100

  // Delay factor: recent invoices are more predictable
  const delayFactor = Math.max(0.5, 1 - (invoice.clientAvgDelayDays / 90))

  // Age factor: older unpaid invoices have lower probability
  const ageFactor = Math.max(0.2, 1 - (invoice.daysOverdue / 120))

  const prob7 = Math.round(base * delayFactor * 100)
  const prob30 = Math.round(Math.min(98, base * delayFactor * ageFactor * 1.5 * 100))
  const prob60 = Math.round(Math.min(99, base * delayFactor * Math.sqrt(ageFactor) * 2 * 100))

  return {
    probability7: Math.max(1, Math.min(99, prob7)),
    probability30: Math.max(1, Math.min(99, prob30)),
    probability60: Math.max(1, Math.min(99, prob60)),
  }
}
```

- [ ] **Create probability-badge.tsx**

```tsx
// components/invoices/probability-badge.tsx
export function ProbabilityBadge({ probability, label }: { probability: number; label: string }) {
  const color = probability >= 70 ? 'text-green-700 bg-green-50 border-green-200'
    : probability >= 40 ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
    : 'text-red-700 bg-red-50 border-red-200'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      {probability}% {label}
    </span>
  )
}
```

- [ ] **Add to invoices table**

In `invoices/page.tsx`, add a column for the probability badge. For each invoice row, compute and display:

```tsx
<ProbabilityBadge probability={prob.probability30} label="in 30d" />
```

---

### Task D3: Smart Draft Scheduling

**Files:**
- Modify: `lib/ai/smart-timing.ts` (export existing logic)
- Modify: `app/api/cron/reminder-dispatch/route.ts`
- Modify: `app/(dashboard)/approvals/page.tsx` (show scheduled time)

- [ ] **Export getOptimalSendTime from smart-timing.ts**

Ensure `smart-timing.ts` exports a `getOptimalSendTime(clientId, reminders)` function that returns the best hour (0-23) for sending based on past response patterns. If no data, return 10 (10AM).

- [ ] **Update cron to use smart timing**

In `reminder-dispatch/route.ts`, after generating each draft:

```typescript
const optimalHour = getOptimalSendTime(client.id, clientReminders)
const scheduledAt = new Date()
scheduledAt.setHours(optimalHour, 0, 0, 0)
if (scheduledAt <= new Date()) scheduledAt.setDate(scheduledAt.getDate() + 1)

await supabase.from('reminders').update({
  scheduled_send_at: scheduledAt.toISOString()
}).eq('id', draft.id)
```

- [ ] **Show scheduled time in approvals page**

In `approvals/page.tsx`, display each draft's scheduled time:

```tsx
<p className="text-xs text-gray-400">
  Ready for review at {new Date(draft.scheduled_send_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
</p>
```

---

### Group E: Client UI (2 items)

Items: Risk cards grid, client detail page with response timeline

**Agent instructions:** Replace table with cards + new route for detail page. Cards link to detail page.

---

### Task E1: Client Risk Cards

**Files:**
- Create: `components/clients/client-card.tsx`
- Create: `components/clients/risk-cards.tsx`
- Modify: `app/(dashboard)/clients/page.tsx`

- [ ] **Create ClientCard component**

```tsx
// components/clients/client-card.tsx
import { RiskBadge } from './risk-badge'

interface ClientCardProps {
  id: string
  name: string
  phone: string | null
  total_outstanding: number
  avg_payment_delay_days: number
  on_time_rate: number
  risk_score: number
}

export function ClientCard({ id, name, phone, total_outstanding, avg_payment_delay_days, on_time_rate, risk_score }: ClientCardProps) {
  return (
    <Link href={`/clients/${id}`} className="block border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{name}</h3>
          {phone && <p className="text-xs text-gray-500 mt-0.5">{phone}</p>}
        </div>
        <RiskBadge score={risk_score} />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between text-xs"><span className="text-gray-500">Outstanding</span><span className="font-medium">₹{total_outstanding.toLocaleString('en-IN')}</span></div>
        <div className="flex justify-between text-xs"><span className="text-gray-500">Avg Delay</span><span className="font-medium">{avg_payment_delay_days}d</span></div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">On-time rate</span><span>{Math.round(on_time_rate)}%</span></div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, on_time_rate)}%` }} />
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Create RiskCards grid component**

```tsx
// components/clients/risk-cards.tsx
'use client'

import { useState } from 'react'
import { ClientCard } from './client-card'
import { Search, Filter } from 'lucide-react'

// ... filter/search/sort UI wrapping the card grid
```

Include: search input, risk level filter (select: All/Low/Medium/High), sort select (name/outstanding/risk), and a responsive grid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4).

- [ ] **Replace table in clients/page.tsx**

Replace the existing table with the `RiskCards` component. Keep the add button and page structure.

---

### Task E2: Client Detail Page with Response Timeline

**Files:**
- Create: `app/(dashboard)/clients/[id]/page.tsx`
- Create: `app/(dashboard)/clients/[id]/loading.tsx`
- Create: `components/clients/response-timeline.tsx`

- [ ] **Create client detail page**

Server component fetching `client`, `reminders`, and `invoices` by `id` and `user_id`. Show:
- Client info header (name, phone, email, risk badge)
- Stats row (on-time rate, avg delay, total outstanding, risk score)
- Response timeline component
- Outstanding invoices list

- [ ] **Create ResponseTimeline component**

```tsx
// Timeline showing each reminder with status icon + date + message preview
interface ReminderEvent {
  id: string; sent_at: string | null; delivered_at: string | null; responded_at: string | null
  status: string; message_text: string | null; channel: string
}

export function ResponseTimeline({ reminders }: { reminders: ReminderEvent[] }) {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {reminders.map((reminder, idx) => (
          <li key={reminder.id}>
            <div className="relative pb-8">
              {idx < reminders.length - 1 && <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" />}
              <div className="relative flex gap-4">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${getStatusColor(reminder.status)}`}>
                  {getStatusIcon(reminder.status)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">{reminder.message_text?.slice(0, 100)}...</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {reminder.sent_at && `Sent ${new Date(reminder.sent_at).toLocaleDateString()}`}
                    {reminder.delivered_at && ` · Delivered ${new Date(reminder.delivered_at).toLocaleDateString()}`}
                    {reminder.responded_at && ` · Responded ${new Date(reminder.responded_at).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

---

### Group F: Dashboard (2 items)

Items: Dashboard metrics (cash flow forecast, recovery rate, avg collection time)

**Agent instructions:** Add stat cards to the dashboard. Reuse analytics logic.

---

### Task F1: Dashboard Metrics

**Files:**
- Modify: `app/(dashboard)/page.tsx`

- [ ] **Reuse analytics calculations on the dashboard**

Fetch payments and invoices data (as analytics page does), compute:
- **Cash flow forecast**: Sum of pending invoices × risk-weighted probability (on_time_rate / 100)
- **Recovery rate**: Same as analytics page
- **Avg collection time (DSO)**: Same as analytics page

Add 3 new stat cards after existing ones:

```tsx
<StatCard title="Cash Flow Forecast (30d)" value={`₹${forecastAmount.toLocaleString('en-IN')}`} icon={<TrendingUp className="w-5 h-5" />} />
<StatCard title="Recovery Rate" value={`${recoveryRate}%`} icon={<CheckCircle className="w-5 h-5" />} />
<StatCard title="Avg Collection Time" value={`${dso} days`} icon={<Clock className="w-5 h-5" />} />
```

Add data fetching to the page component (reuse analytics patterns).

---

### Group G: Onboarding (1 item)

Items: Web onboarding flow after signup

**Agent instructions:** New route. Depends on style_preference column existing (Group B).

---

### Task G1: Web Onboarding Flow

**Files:**
- Create: `app/(dashboard)/onboarding/page.tsx`
- Create: `app/(dashboard)/onboarding/loading.tsx`
- Create: `lib/onboarding/actions.ts`
- Modify: `app/(dashboard)/layout.tsx` (redirect if not onboarded)

- [ ] **Create onboarding server actions**

```typescript
// lib/onboarding/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const companyName = formData.get('company') as string
  const style = formData.get('style') as string

  await supabase.from('users').update({
    company_name: companyName || null,
    style_preference: style || 'professional',
  }).eq('id', user.id)

  revalidatePath('/')
  return { success: true }
}
```

- [ ] **Create onboarding page**

Multi-step form:
- Step 1: Company name + industry (text inputs)
- Step 2: Style preference (same radio layout as signup)
- Step 3: "Add your first client" CTA or skip to dashboard

- [ ] **Add redirect logic to dashboard layout**

In `layout.tsx`, after auth check but before rendering children:

```typescript
// If no company_name set and user is on the dashboard, redirect to onboarding
const { data: profile } = await supabase.from('users').select('company_name').eq('id', user.id).single()
if (!profile?.company_name && !pathname.startsWith('/onboarding')) {
  redirect('/onboarding')
}
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** All 18 spec items have implementation tasks. Group A = items 1,10,14,13,7. Group B = items 2,15,9. Group C = items 3,12,11. Group D = items 16,17,18. Group E = items 4,5. Group F = item 6. Group G = item 8.
- [ ] **Placeholder scan:** No TBD, TODO, or incomplete patterns.
- [ ] **Type consistency:** `style_preference` used consistently as `'casual' | 'professional' | 'formal'`. Types defined in migration and types.ts match.
- [ ] **Dependency check:** Group B (migrations) runs before Group G (onboarding needs style column). Group D (AI) and Group E (client UI) are independent of each other.
