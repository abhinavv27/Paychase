# PayChase AI — Post-P1 Product Roadmap

> **Status:** Design doc
> **Goal:** Ship P2 features, harden production, deploy to Vercel, polish UX
> **Phases:** 4 phases, 8 sub-projects, sequential execution

---

## Phase 1: P2 Features

### 1.1 Client Activity Log

**Purpose:** Show a timeline of payment + communication events per client on their detail page.

**Data model — new table `client_events`:**
```sql
create table client_events (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) not null,
  user_id uuid references users(id) not null,
  event_type text not null, -- 'invoice_sent', 'invoice_paid', 'reminder_sent', 'reminder_delivered', 'reminder_responded', 'note_added'
  event_data jsonb default '{}', -- { invoice_id, amount, channel, message_preview }
  created_at timestamptz default now()
);
```

**Events tracked automatically:**
- `invoice_sent` — when cron dispatches a reminder
- `invoice_paid` — when invoice status changes to paid
- `reminder_sent/delivered/responded` — from delivery status updates

**UI:** New "Activity" tab on the client detail page (`/clients/[id]`) with a reverse-chronological feed. Each event shows an icon, timestamp, and contextual description.

**Files:**
- `src/lib/client-events.ts` — insert + query functions
- `src/app/api/clients/[id]/events/route.ts` — API endpoint
- `src/components/clients/activity-feed.tsx` — timeline UI
- Modify: `src/app/(dashboard)/clients/[id]/page.tsx` — add activity tab

**Dependencies:** Existing client detail page (Group E2 from earlier).

---

### 1.2 CSV Invoice Import

**Purpose:** Bulk-import invoices from a CSV file.

**CSV Format (standard):**
```csv
client_name,amount,due_date,invoice_number,client_phone,client_email
Acme Corp,50000,2026-06-15,INV-001,+919876543210,billing@acme.com
```

**Flow:**
1. User uploads CSV on `/invoices/import` page
2. Server parses CSV, validates rows
3. Creates clients on-the-fly (matched by phone/name or new)
4. Creates invoices linked to clients
5. Shows result summary (X imported, Y errors)

**Edge cases:**
- Duplicate invoice_number → skip (+ error row)
- Missing client_name or amount → skip (+ error row)
- Client matched by phone if exists, else by name
- Rate limit: max 500 rows per import

**Files:**
- `src/app/(dashboard)/invoices/import/page.tsx` — upload UI
- `src/app/api/invoices/import/route.ts` — parse + import endpoint
- `src/lib/invoices/csv-import.ts` — CSV parsing + validation logic
- `src/components/invoices/import-result.tsx` — result display

**Dependencies:** Needs `papaparse` npm package for CSV parsing.

---

### 1.3 Custom Message Templates

**Purpose:** Let users customize follow-up message text beyond the built-in presets.

**Data model — new table `custom_templates`:**
```sql
create table custom_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) not null,
  name text not null,
  language text not null default 'en',
  escalation_level text not null, -- 'gentle', 'firm', 'urgent'
  message_text text not null,
  variables text[] default '{clientName, invoiceNumber, amount, dueDate}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Template variables available:**
- `{clientName}` — client's name
- `{invoiceNumber}` — invoice number
- `{amount}` — formatted amount (₹50,000)
- `{dueDate}` — due date
- `{overdueDays}` — days overdue
- `{paymentLink}` — UPI payment link if available

**UI:**
- New "Templates" page under settings (`/settings/templates`)
- List existing templates per language/escalation level
- Create/edit with a text area + variable picker buttons
- Preview rendered message with sample data

**Integration:** When generating a message, check for a custom template first; if none exists, fall back to built-in translations.

**Files:**
- `src/app/(dashboard)/settings/templates/page.tsx` — templates list
- `src/app/(dashboard)/settings/templates/[id]/edit/page.tsx` — editor
- `src/lib/ai/custom-templates.ts` — CRUD + lookup logic
- `src/components/templates/template-editor.tsx` — editor form
- `src/components/templates/variable-picker.tsx` — clickable variable buttons
- Modify: `src/lib/ai/message-generator.ts` — check custom templates before fallback

---

### 1.4 Payment Reconciliation

**Purpose:** Auto-match Razorpay payment events to invoices and allow manual reconciliation.

**Two modes:**

**A) Manual:**
- On the invoices page, user can already mark as paid (exists from INV-4)
- Add a "Reconcile" view showing unmatched payments

**B) Razorpay Webhook:**
- Razorpay sends `payment.captured` events to `/api/webhooks/razorpay`
- Match by `invoice_number` in `payment.notes` or by amount+client
- On match: mark invoice as paid, record payment transaction ID, create client event
- On no match: create an "Unmatched Payment" record for manual review

**New table `payment_transactions`:**
```sql
create table payment_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) not null,
  invoice_id uuid references invoices(id),
  razorpay_payment_id text unique,
  amount numeric not null,
  currency text default 'INR',
  status text not null, -- 'matched', 'unmatched', 'refunded'
  matched_at timestamptz,
  created_at timestamptz default now()
);
```

**UI — Reconciliation Dashboard:**
- `/reconciliation` page showing recently matched + unmatched payments
- Unmatched payments can be manually assigned to an invoice

**Files:**
- `src/app/api/webhooks/razorpay/route.ts` — webhook handler
- `src/app/(dashboard)/reconciliation/page.tsx` — reconciliation UI
- `src/lib/payments/reconciliation.ts` — matching logic
- `src/components/payments/unmatched-list.tsx` — unmatched payments view

---

### 1.5 Team/Org Mode (Multi-Tenant)

**Purpose:** Allow multiple users to share an organization with role-based access.

**Data model — new tables:**
```sql
create table organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  plan text default 'free',
  created_at timestamptz default now()
);

create table organization_members (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) not null,
  user_id uuid references users(id) not null,
  role text not null default 'member', -- 'admin', 'member', 'viewer'
  invited_by uuid references users(id),
  invited_at timestamptz default now(),
  joined_at timestamptz,
  unique(organization_id, user_id)
);
```

**Migration:**
- Add `organization_id` to `users`, `clients`, `invoices`, `reminders` tables
- Backfill: create org for each existing user, assign them as admin, set org_id on all their data

**Access control:**
- **Admin:** full control — manage members, invoices, clients, settings, billing
- **Member:** create/edit invoices and clients, send reminders, view reports
- **Viewer:** read-only access to everything

**UI:**
- `/settings/team` — invite members, manage roles
- Invite flow: email invite → accept → redirect to org
- Org switcher in sidebar if user belongs to multiple orgs

**Files:**
- `src/lib/orgs/queries.ts` — org CRUD
- `src/lib/orgs/members.ts` — member management
- `src/app/(dashboard)/settings/team/page.tsx` — team management UI
- `src/components/team/invite-form.tsx` — invite member form
- `src/components/team/member-list.tsx` — member list with role badges
- `src/middleware.ts` — org-scoped data access middleware
- Modify: all dashboard queries — scope by `organization_id`

**Dependencies:** Largest feature. Touches every data access layer. Requires careful migration.

---

## Phase 2: Production Hardening

### 2.1 Sentry Verification

**Task:** Confirm Sentry is wired correctly and capturing errors.

- Check `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` exist and are configured
- Add `Sentry.captureException()` in key error boundaries
- Add performance tracing for dashboard page loads
- Add a test endpoint `/api/debug/sentry` to verify capture works

**Files:**
- `src/app/api/debug/sentry/route.ts` — test endpoint (remove after verification)
- Modify: error boundaries to use `Sentry.captureException`

### 2.2 API Rate Limiting

**Purpose:** Prevent abuse on API routes with Upstash rate limiting.

**Strategy:**
- Use Upstash Redis for distributed rate limiting (already in deps?)
- Check if Upstash is already configured — if so, use `@upstash/ratelimit`
- Apply to: all POST/PATCH/DELETE API routes
- Limit: 100 requests per minute per user/IP
- Return `429 Too Many Requests` with retry-after header

**Files:**
- `src/lib/rate-limit.ts` — shared rate limit helper
- Modify: each API route — wrap with rate limiter middleware

---

## Phase 3: Deployment

### 3.1 Vercel Setup

**Steps:**
1. Install Vercel CLI
2. Run `vercel link` to link project
3. Set up all env vars from `.env.example` in Vercel dashboard
4. Add `vercel.json` for build configuration
5. Configure preview deployments per branch
6. Set up custom domain if available

**Files:**
- `vercel.json` — build config
- `.vercel/project.json` — project link (auto-generated)

### 3.2 CI/CD Pipeline

**GitHub Actions workflow:**
- On push to `main`: run tests + lint, deploy to Vercel production
- On PR: run tests + lint, deploy to Vercel preview
- Slack/email notification on failure

**Files:**
- `.github/workflows/ci.yml` — CI pipeline
- `.github/workflows/deploy.yml` — deploy pipeline

---

## Phase 4: Polishing

### 4.1 Empty States

**Every list page needs:**
- `src/components/ui/empty-state.tsx` — reusable component (icon + title + description + action button)
- Apply to: invoices list, clients list, approvals list, reconciliation page, team members list

### 4.2 Loading Skeletons

**Every page that fetches data needs:**
- `src/components/ui/skeleton.tsx` — reusable skeleton components
- Apply to: dashboard metrics, invoices table, clients cards, approvals list, client detail

### 4.3 Toast Notifications

**Every action needs feedback:**
- Install/react-hot-toast or use native browser toast
- Wrap layout with `<Toaster />`
- Show toast on: mark paid, create invoice, approve/dismiss reminder, add client, import CSV, invite member

### 4.4 Responsive Layout

**Target: tablet (768px) and above.**
- Check all dashboard pages at 768px width
- Fix: sidebar collapse, table horizontal scroll, card grid reduction, font sizing
- No mobile-first requirement — tablet is the minimum supported viewport

---

## Execution Order

```
Phase 1.1 (Client Activity Log)
  → 1.2 (CSV Import)
  → 1.3 (Custom Templates)
  → 1.4 (Payment Reconciliation)
  → 1.5 (Team/Org Mode)
  → Phase 2 (Hardening)
  → Phase 3 (Deployment)
  → Phase 4 (Polishing)
```

Team/Org Mode (1.5) is last in P2 because it has the most dependencies. Deployment (Phase 3) comes after hardening. Polishing (Phase 4) is last because it touches everything.
