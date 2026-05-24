# PayChase AI — P0/P1 Feature Completion Design

**Date:** 2026-05-23  
**Status:** Draft  
**Scope:** 18 items across UX, AI, payments, and onboarding

---

## 1. WhatsApp Auto-Send Bug Fix (Blocker)

### Problem
`approvals/actions.ts:approveDraft()` sends messages via WhatsApp Cloud API (`graph.facebook.com`) — violating the core product principle: **"Messages are NEVER sent automatically. User must explicitly approve and send."**

### Solution
Replace the WhatsApp API send call with a wa.me deep link generator. When user approves a draft, return a `wa.me` URL pre-filled with the message. The user opens WhatsApp on their phone and manually sends.

### Changes
- `approvals/actions.ts`: Remove `sendWhatsAppMessage()` call, generate `wa.me` deep link via existing `lib/whatsapp/deep-link.ts`
- `approvals/page.tsx`: Show deep link after approval with copy-to-clipboard button and "Open WhatsApp" link
- `lib/whatsapp/deep-link.ts`: Verify it handles the full message text encoding correctly

---

## 2. Style Preference Setup (ONB-2, P0)

### Problem
AI engine (`message-generator.ts`) accepts `userStyle: 'casual' | 'professional' | 'formal'` but the value is never set by the user — always defaults to `'professional'`.

### Solution
- Add `style_preference VARCHAR` column to `users` table with default `'professional'`
- Add radio/select UI to signup page (`(auth)/signup/page.tsx`)
- Add style selector to settings page (`(dashboard)/settings/page.tsx`)
- Wire `userStyle` through the cron job (`reminder-dispatch/route.ts`) — fetch user's preference via join/query

### Changes
- New migration: `004_style_preference.sql`
- `(auth)/actions.ts`: Pass style during signup
- `(auth)/signup/page.tsx`: Style selector
- `(dashboard)/settings/page.tsx`: Style selector
- `lib/supabase/types.ts`: Update User type
- `api/cron/reminder-dispatch/route.ts`: Pass `userStyle` to `generateFollowUpMessage()`

---

## 3. UPI Auto-Generation (INV-6, P0)

### Problem
Razorpay payment link API (`/api/invoices/[id]/payment-link`) exists but is never called automatically on invoice creation.

### Solution
Call `createPaymentLink()` inside `createInvoiceAction()` after the invoice is created. Add "Regenerate Link" button on invoice edit page for failure recovery.

### Changes
- `lib/invoices-actions.ts`: After successful invoice insert, call `createPaymentLink()`, update `upi_link` column
- `invoices/[id]/edit/page.tsx`: Show regenerate button if `upi_link` is missing or errored
- `api/invoices/[id]/payment-link/route.ts`: Add paid-invoice guard

---

## 4. Client Risk Cards (DASH-3, P0)

### Problem
Clients page is a plain table. PRD specifies visual risk cards with filtering and sorting.

### Solution
Replace table with responsive card grid (2-3 columns). Add:
- Search bar (filter by name)
- Risk level filter dropdown (All / Low / Medium / High)
- Sort dropdown (name / outstanding / risk score)
- Each card is clickable → navigates to new client detail page (`/clients/[id]`)

### Changes
- `(dashboard)/clients/page.tsx`: Replace table with card grid, add filter/search/sort
- `components/clients/risk-cards.tsx`: New component for card grid
- `components/clients/client-card.tsx`: Individual card component

---

## 5. Client Detail Page (CLI-8, P0)

### Problem
No per-client detail view exists. Response history, invoice list, and client stats are not accessible from a single page.

### Solution
New route `/clients/[id]` showing:
- Client info header (name, phone, email, risk badge)
- Timeline of reminders/follow-ups with delivery/response status
- Outstanding invoices list
- Key stats: on-time rate, avg delay, total outstanding, risk score

### Changes
- `(dashboard)/clients/[id]/page.tsx`: New page with data fetching for client + reminders + invoices
- `(dashboard)/clients/[id]/loading.tsx`: Loading skeleton
- `components/clients/response-timeline.tsx`: Timeline component
- Link from client cards to this detail page

---

## 6. Dashboard Metrics (DASH-1, P0)

### Problem
Dashboard shows "Messages Sent This Week" and "Collected This Month" but is missing PRD-required metrics: cash flow forecast, recovery rate, avg collection time.

### Solution
Add three new stat cards to the dashboard:
- **Cash Flow Forecast**: Projected recoverable amount for next 30 days (sum of pending invoices with risk-weighted probability)
- **Recovery Rate**: Percentage of invoices paid on time (reuse from analytics page)
- **Avg Collection Time**: Average days from invoice issue to payment (reuse DSO from analytics page)

### Changes
- `(dashboard)/page.tsx`: Add 3 new stat cards, fetch additional data

---

## 7. Approvals in Sidebar

### Problem
`/approvals` is the core workflow page but has no navigation entry — users can only reach it via the dashboard action banner.

### Solution
Add "Approvals" nav link with a badge showing pending draft count.

### Changes
- `(dashboard)/layout.tsx`: Add nav item with count badge
- Fetch pending draft count in layout or use a lightweight query

---

## 8. Web Onboarding Flow (ONB-1, ONB-2, ONB-3, P0/P1)

### Problem
Post-signup, user lands on empty dashboard. No company setup, style preference selection, or first client import wizard.

### Solution
Add a post-signup onboarding modal/page that fires on first login:
- Step 1: Company name + industry
- Step 2: Communication style (casual/professional/formal)
- Step 3: "Add your first client" (CTA to /clients/add) or skip

Detection: check if `users.company_name` is empty/null on first dashboard load.

### Changes
- `(dashboard)/onboarding/page.tsx`: New onboarding flow
- `(dashboard)/layout.tsx`: Redirect to onboarding if not completed
- `lib/onboarding/actions.ts`: Server actions for onboarding steps

---

## 9. Settings Improvements

### Problem
Settings page is read-only. Users can't edit name, company, style preference, export data, or delete account.

### Solution
- Make name + company fields editable
- Add style preference selector
- Add data export button (JSON/CSV)
- Add "Delete Account" action with confirmation

### Changes
- `(dashboard)/settings/page.tsx`: Convert from read-only to editable form
- `(dashboard)/settings/actions.ts`: Add update/export/delete actions

---

## 10. Page Metadata

### Problem
Every page renders `<title>Create Next App</title>` — Next.js boilerplate.

### Solution
Update root layout title/description + add per-page metadata exports.

### Changes
- `app/layout.tsx`: Change title to "PayChase AI — AI Payment Follow-ups"
- Each page: Add `metadata` export with page-specific title

---

## 11. Delete Client Action

### Problem
No server action exists for deleting a client despite PRD requirement (CLI-3).

### Solution
Add `deleteClientAction` server action with cascading delete (invoices, reminders, payments, drafts).

### Changes
- `lib/clients-actions.ts`: Add `deleteClientAction` with confirmation
- `components/clients/delete-button.tsx`: Reuse pattern from `components/invoices/delete-button.tsx`

---

## 12. Inline Client Creation

### Problem
Invoice creation page has no way to create a client inline — user must navigate away to `/clients/add`.

### Solution
Add "Create Client" button/modal within the invoice create form.

### Changes
- `components/clients/quick-create-form.tsx`: Minimal client creation form (name, phone, email)
- `components/invoices/invoice-form.tsx`: Add client creation modal trigger

---

## 13. Invoices Empty State

### Problem
Invoices table shows bare text "No invoices found." with no icon or CTA button.

### Solution
Replace text with full empty state: illustration icon, descriptive text, and "Create your first invoice" button.

### Changes
- `(dashboard)/invoices/page.tsx`: Replace empty row with proper empty state component

---

## 14. Phone Link Loading State

### Problem
Phone linking button never shows a loading state — text stays "Link" during submission.

### Solution
Add `isPending` tracking to `phone-link-form.tsx` similar to other forms.

### Changes
- `components/settings/phone-link-form.tsx`: Add `useFormStatus` or manual pending state, show "Linking..." during submission

---

## 15. Duplicate Invoice Check

### Problem
No duplicate invoice number detection — race conditions or accidental duplicates produce multiple invoices with the same number.

### Solution
Add a UNIQUE constraint on `(user_id, invoice_number)` and handle the error in the create action.

### Changes
- New migration: `005_unique_invoice_number.sql`
- `lib/invoices-actions.ts`: Catch unique constraint error and return user-friendly message

---

## 16. AI Collection Health Score

### Problem
No single metric that communicates "how healthy is my collection process" at a glance. Sales/demo context: telling a prospect "your collection health is 42/100" is more powerful than showing 5 separate numbers.

### Solution
A single 0-100 composite score combining:
- **DSO score** (30pts): 30 if DSO < 15, scales down linearly to 0 at DSO > 60
- **Recovery rate score** (25pts): Direct percentage mapping (25% recovery = 6.25 pts)
- **At-risk concentration** (20pts): 20 if <10% of outstanding is high-risk, 0 if >50%
- **Approval rate** (15pts): 15 if >70% drafts approved, scales down
- **Collection velocity** (10pts): 10 if most invoices paid within due date+15 days

Shown on dashboard as a large gauge/progress ring with color (red < 40, yellow 40-70, green > 70). Update on page load from existing data.

### Changes
- `lib/ai/collection-health.ts`: New module computing the score
- `components/dashboard/health-score.tsx`: Visual gauge component
- `(dashboard)/page.tsx`: Add health score card

---

## 17. Payment Probability Per Invoice

### Problem
Users see invoice amounts but have no sense of "will this actually get paid soon?" This is a high-value AI insight that looks impressive in demos.

### Solution
Add a probability badge to each invoice in the list showing likelihood of payment within 7/30/60 days:
- Uses client's `on_time_rate`, `avg_payment_delay_days`, invoice age, and amount
- Deterministic formula: `base_probability = on_time_rate * delay_factor * invoice_age_factor`
- Display: colored badge (green > 70%, yellow 40-70%, red < 40%) with text like "72% likely in 7 days"

### Changes
- `lib/ai/payment-probability.ts`: New computation module
- `components/invoices/probability-badge.tsx`: Badge component
- `(dashboard)/invoices/page.tsx`: Add badge column
- Add tests for probability calculation

---

## 18. Smart Draft Scheduling

### Problem
All AI drafts generate at 6AM IST. But different clients respond better at different times. The smart-timing module already tracks per-client response patterns but isn't used.

### Solution
When the cron generates drafts, spread them across the day based on each client's optimal send time (from `smart-timing.ts`):
- Group drafts by client timezone preference (if known)
- Schedule higher-urgency drafts earlier
- If no response data exists for a client, use default time (10AM)
- Store `scheduled_send_at` on each draft so the dashboard can show "Ready for review at 2PM" instead of just "Pending"

### Changes
- `api/cron/reminder-dispatch/route.ts`: Use `getOptimalSendTime()` from smart-timing to set `scheduled_send_at`
- `(dashboard)/approvals/page.tsx`: Show scheduled time on each draft card
- `lib/ai/smart-timing.ts`: Verify/export the per-client timing logic

---

## Architecture & Dependencies

### Dependency Graph
```
Blocker: WhatsApp Auto-Send Fix ───────────────── (no deps)
Style Preference Setup ─────── depends on: migration
UPI Auto-Generation ────────── depends on: none (pure add)
Client Risk Cards ──────────── depends on: none (UI change)
Client Detail Page ─────────── depends on: Risk Cards (linking)
Dashboard Metrics ──────────── depends on: none
Approvals Sidebar ──────────── depends on: none
Web Onboarding ─────────────── depends on: Style Preference
Settings Improvements ──────── depends on: Style Preference
Page Metadata ──────────────── depends on: none
Delete Client ──────────────── depends on: none
Inline Client Creation ─────── depends on: none
Invoices Empty State ───────── depends on: none
Collection Health Score ─────── depends on: none (new module)
Payment Probability ────────── depends on: none (new module)
Smart Draft Scheduling ─────── depends on: Style Preference (userStyle)
Duplicate Invoice Check ────── depends on: migration
Collection Health Score ────── depends on: none (new module)
Payment Probability ────────── depends on: none (new module)
Smart Draft Scheduling ─────── depends on: Style Preference
```

### Execution Order (7 groups for subagents)
1. **Group A** (blocker + polish): WhatsApp fix, page metadata, phone link loading, invoices empty state
2. **Group B** (migrations + style): Style preference, duplicate check, settings improvements
3. **Group C** (payments + invoices): UPI generation, inline client creation, delete client
4. **Group D** (AI features): Collection health score, payment probability, smart draft scheduling
5. **Group E** (client UI): Risk cards, client detail page
6. **Group F** (dashboard): Dashboard metrics, approvals sidebar
7. **Group G** (onboarding): Web onboarding flow
