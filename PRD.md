# PayChase AI — Product Requirements Document (PRD)

**Version:** 3.0  
**Date:** 2026-05-24  
**Status:** Active  
**Author:** opencode (AI-assisted)

---

## 1. Problem Statement

Chasing payments is awkward. Freelancers and small agencies in India need to collect money but fear damaging client relationships. The tension between "I need to get paid" and "I don't want to be that person" leads to:

- **Delayed follow-ups** — Messages sent too late, extending payment cycles by 15-30 days
- **Inconsistent tone** — Too soft and clients ignore; too harsh and relationships break
- **No escalation strategy** — Every message feels like the first one, no progression
- **Time wasted composing** — 5-10 hours/week thinking about what to say and when
- **Relationship anxiety** — Fear of being perceived as unprofessional or desperate

The core problem is not just time — it's the emotional friction of asking for money while preserving relationships.

---

## 2. Product Vision

**PayChase AI** removes the awkwardness of chasing payments. AI drafts the perfect follow-up message, you review it in 10 seconds, and send it from your own WhatsApp number. You're always in control — messages are NEVER sent automatically.

**North Star Metric:** Reduce average payment collection time by 15 days while maintaining client satisfaction scores.

**Key Principle:** The AI writes, you decide. Full transparency, full control, zero surprise sends.

---

## 3. Target Users

### Primary: Freelancers & Consultants
- 1-5 people
- Revenue: ₹5L-₹50L/year
- Willingness to pay: ₹500-₹2,000/month
- Pain: Relationship anxiety around payment follow-ups, time wasted composing messages

### Secondary: Small Agencies
- 5-20 people (marketing, design, dev shops)
- Revenue: ₹50L-₹5Cr/year
- Willingness to pay: ₹2,000-₹5,000/month
- Pain: Inconsistent follow-up across team members, no standardized escalation process

---

## 4. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Avg collection time reduction | -15 days | Dashboard analytics |
| Payment recovery rate improvement | +40% vs manual | A/B comparison |
| Draft approval rate | 70%+ | Percentage of AI drafts users approve without edits |
| Time spent per follow-up | < 10 seconds | User interaction tracking |
| 3-month retention | 80%+ | Cohort analysis |
| WhatsApp send rate (via deep link) | 85%+ | Approved drafts that result in wa.me click |
| UPI payment click-through | 30%+ | Razorpay analytics |
| Client response rate | 50%+ | Responses tracked via manual logging |

---

## 5. Feature Requirements

### 5.1 Authentication & Onboarding

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| AUTH-1 | Email/Password Signup | P0 | Supabase Auth with email verification |
| AUTH-2 | Login | P0 | Email/password login with session management |
| AUTH-3 | Forgot Password | P1 | Password reset via email link |
| ONB-1 | Company Setup | P1 | Collect company name, phone, industry during first login |
| ONB-2 | Style Preference Setup | P0 | User selects communication style (casual/professional/formal) during onboarding |
| ONB-3 | First Client Import | P1 | Guided flow to add first client or upload CSV |

### 5.2 Client Management

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| CLI-1 | Add Client | P0 | Manual form: name, phone, email, industry |
| CLI-2 | Edit Client | P0 | Update client details |
| CLI-3 | Delete Client | P1 | Cascading delete (invoices, reminders, drafts, payments) |
| CLI-4 | Client List | P0 | Sortable, filterable table with risk score badges |
| CLI-5 | Client Risk Cards | P0 | Visual cards showing risk score, outstanding, avg delay, on-time rate, last response |
| CLI-6 | CSV Import | P1 | Upload CSV with pre-flight validation, partial import, error report |
| CLI-7 | Consent Tracking | P0 | DPDP-compliant consent checkbox on client creation, logged in consent_log table |
| CLI-8 | Response History | P0 | Track client responses (replied/promised/silent/disputed) per follow-up |
| CLI-9 | Client Activity Log | P2 | Reverse-chronological timeline of payment + communication events per client with icons |

### 5.3 Invoice Management

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| INV-1 | Create Invoice | P0 | Manual form: client, number, amount, issue date, due date |
| INV-2 | Edit Invoice | P0 | Update invoice details |
| INV-3 | Invoice List | P0 | Filterable by status (pending, paid, overdue), sortable |
| INV-4 | Bulk Actions | P1 | Select multiple invoices, generate drafts, mark paid |
| INV-5 | Invoice Status Tracking | P0 | Auto-update on payment webhook |
| INV-6 | UPI Link Generation | P0 | Auto-generate Razorpay payment link on invoice creation |

### 5.4 AI Engine — Message Generation

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| AI-1 | Draft Generation | P0 | Generate personalized follow-up message for each overdue invoice |
| AI-2 | Escalation Levels | P0 | Three tiers: gentle (1st), firm (2nd), urgent (3rd+) — auto-determined by follow-up count and days overdue |
| AI-3 | Style Presets | P0 | User-selected tone: casual, professional, formal — applied to all drafts |
| AI-4 | Response History Awareness | P0 | AI adjusts draft based on client's last response (replied, promised, silent, disputed) |
| AI-5 | Payment Date Prediction | P1 | Predict when client will pay based on historical avg delay |
| AI-6 | Confidence Intervals | P1 | ±7 day confidence window around predicted date |
| AI-7 | Smart Timing Suggestion | P1 | Suggest optimal time to review/approve drafts based on client response patterns |
| AI-8 | LLM Upgrade Path (v2) | P2 | Upgrade from template-based to LLM-generated messages with learning from approved drafts |

### 5.5 Messaging & Reminders

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| MSG-1 | WhatsApp Deep Links | P0 | Generate wa.me URLs with pre-filled message text. User opens WhatsApp and sends from their own number |
| MSG-2 | Email Reminders | P1 | Fallback via Resend when WhatsApp unavailable |
| MSG-3 | Multilingual Support | P1 | Drafts in English, Hindi, Tamil, Telugu, Bengali |
| MSG-4 | Draft Generation Cron | P0 | Daily cron at 6 AM IST generates drafts for all overdue invoices |
| MSG-5 | NO Auto-Send | P0 | Messages are NEVER sent automatically. User must explicitly approve and send |
| MSG-6 | Delivery Tracking | P1 | Manual status logging: sent, delivered, replied (user marks after sending) |
| MSG-7 | Fallback Logic | P1 | No WhatsApp number → email draft fallback |
| MSG-8 | Message Approval Workflow | P0 | Core workflow: cron generates drafts → user sees in dashboard → reviews/edits → approves → wa.me link opens → user sends |
| MSG-9 | Custom Message Templates | P2 | User-customizable message text with variable insertion per language and escalation level |

### 5.6 Payments

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| PAY-1 | Razorpay Integration | P0 | Create payment links, embed in message drafts |
| PAY-2 | Webhook Handler | P0 | Idempotent payment capture via UNIQUE constraint on razorpay_payment_id |
| PAY-3 | Payment Recording | P0 | Auto-record payment, mark invoice paid, update AI model |
| PAY-4 | Payment Reconciliation | P1 | Cron job every 30 min to catch missed webhooks + manual matching UI |
| PAY-5 | Payment Transactions Table | P2 | Track matched/unmatched Razorpay payments with manual invoice assignment |
| PAY-6 | Partial Payments | P2 | Support partial payment against invoice amount |

### 5.7 Dashboard

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| DASH-1 | Overview Page | P0 | Total outstanding, cash flow forecast, recovery rate, avg collection time |
| DASH-2 | Draft Approval Queue | P0 | Primary inbox showing pending AI drafts with preview, edit, approve, dismiss actions |
| DASH-3 | Client Risk Page | P0 | Risk cards with sort/filter by risk score |
| DASH-4 | Invoice Manager | P0 | Full CRUD with filters, bulk actions, CSV upload |
| DASH-5 | AI Insights Page | P0 | Late payment predictions, optimal collection day, at-risk amounts |
| DASH-6 | Recovery Analytics | P1 | DSO trends, recovery rates, approval rate trends |
| DASH-7 | ISR Caching | P1 | 5-min revalidate, tag-based invalidation on data changes |
| DASH-8 | UI Primitives | P2 | Reusable EmptyState, Skeleton/TableSkeleton/CardSkeleton components across all pages |
| DASH-9 | Toast Notifications | P2 | Feedback toasts on all mutation actions (mark paid, approve, delete, add client) |

### 5.8 Compliance & Security

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| SEC-1 | Row-Level Security | P0 | All 9 tables scoped to user_id via Supabase RLS |
| SEC-2 | DPDP Consent Log | P0 | Audit trail of all consent events |
| SEC-3 | Data Deletion | P1 | One-click cascading delete for client data |
| SEC-4 | Data Export | P1 | Export client/invoice/draft data as JSON/CSV |
| SEC-5 | Rate Limiting | P1 | 100 req/min per user via Upstash Redis |
| SEC-6 | Data Retention | P2 | Delete consent logs after 3 years |
| SEC-7 | Sentry Error Monitoring | P2 | Global error boundary capturing exceptions to Sentry |
| ORG-1 | Organization Schema | P2 | Multi-tenant database schema (organizations, organization_members) with RLS — full team mode deferred |

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Dashboard page load | < 2s (ISR cached) |
| **Performance** | API response time | < 500ms (p95) |
| **Performance** | Draft generation | < 2s per draft |
| **Performance** | Cron job execution | < 60s (paginated, 100/batch) |
| **Scalability** | Max users (free tier) | 10K users |
| **Scalability** | Max invoices/user | 500 (free), 5000 (paid) |
| **Reliability** | Draft generation success | 99%+ |
| **Reliability** | Webhook idempotency | 100% (UNIQUE constraint) |
| **Availability** | Uptime target | 99.5% (Vercel free tier) |
| **Security** | Auth | Supabase Auth (JWT) |
| **Security** | Data isolation | RLS on all tables |
| **Security** | No auto-send guarantee | Zero messages sent without explicit user approval |
| **Compliance** | DPDP Act 2023 | Consent tracking, data minimization, deletion rights |

---

## 7. Technical Architecture

### 7.1 Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend + API | Next.js 14 (App Router, TypeScript) | Single codebase, serverless, Vercel hosting |
| Database | Supabase (PostgreSQL + RLS) | Free tier generous, auth included, row-level security |
| WhatsApp | wa.me deep links | Zero API cost, user sends from own number, preserves relationships |
| Email | Resend | 3,000 emails/month free |
| AI | Template-based v1 → LLM v2 | Deterministic, debuggable, sufficient for v1 |
| Payments | Razorpay | UPI links, webhooks, 2% per transaction |
| Hosting | Vercel | Free tier: 100GB bandwidth, serverless, cron |
| Rate Limiting | Upstash Redis + @upstash/ratelimit | 10K requests/day free |
| Error Tracking | Sentry | Free tier: 5K events/month |
| CSV Parsing | papaparse | Client-side CSV parsing with validation |
| Toast Notifications | react-hot-toast | Lightweight, dark-themed toast provider |

### 7.2 Cron Jobs

| Job | Schedule | Pagination | Purpose |
|-----|----------|------------|---------|
| AI Draft Generation | Daily 6 AM IST | 100 invoices/batch | Generate message drafts for overdue invoices — checks custom templates, falls back to email |
| Payment Reconciliation | Every 30 min | N/A | Catch missed webhooks + tries to auto-match unmatched transactions |
| Consent Cleanup | Monthly 1st 3 AM | 100 records/batch | Delete old consent logs |

### 7.3 Data Flow

```
User signs up → Supabase Auth → RLS isolates data
User sets style preference → casual/professional/formal stored
User uploads invoices → CSV validated → Clients created/updated
Vercel Cron (6 AM) → AI generates drafts → Stores in message_drafts table
  - Checks custom_templates for user's override; falls back to built-in translations
  - Supports 5 languages: en, hi, ta, te, bn
  - Falls back to email (Resend) if client has no WhatsApp number
Dashboard shows pending drafts → User reviews, edits if needed, approves
Approved draft → wa.me link generated → Opens WhatsApp with pre-filled message
User hits send in WhatsApp → Message sent from user's own number
User marks as sent/delivered/replied → Delivery status tracked per draft
Client paid via UPI → Razorpay webhook (idempotent) → Transaction matched or queued
  - Auto-matched: invoice → paid, transaction → matched
  - Unmatched: appears in reconciliation dashboard for manual assignment
Dashboard refreshes (ISR 5-min) → Shows updated metrics
Client detail page shows activity timeline of all payment + communication events
```

### 7.4 Approval Workflow Detail

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CRON      │────▶│   AI DRAFT  │────▶│  DASHBOARD  │────▶│   APPROVE   │
│  6 AM IST   │     │  GENERATOR  │     │   INBOX     │     │   / EDIT    │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                                                      ┌────────────┼────────────┐
                                                      ▼            ▼            ▼
                                                ┌──────────┐ ┌──────────┐ ┌──────────┐
                                                │ APPROVE  │ │  EDIT    │ │ DISMISS  │
                                                └────┬─────┘ └────┬─────┘ └────┬─────┘
                                                     │            │            │
                                                     ▼            │            │
                                                ┌──────────┐     │            │
                                                │ wa.me    │     │            │
                                                │ link     │     │            │
                                                └────┬─────┘     │            │
                                                     │           │            │
                                                     ▼           ▼            ▼
                                                ┌─────────────────────────────────┐
                                                │      WHATSAPP (USER'S PHONE)    │
                                                │   Pre-filled message, user      │
                                                │   reviews and hits SEND         │
                                                └─────────────────────────────────┘
```

---

## 8. Pricing Tiers

| Tier | Price | Invoices | Features |
|------|-------|----------|----------|
| **Free** | ₹0/month | 10 | Basic drafts, manual review |
| **Starter** | ₹999/month | 50 | AI drafts, escalation levels, style presets |
| **Growth** | ₹2,999/month | 500 | Response history, multilingual drafts, UPI links |
| **Business** | ₹7,999/month | Unlimited | Tally/Zoho sync, team access, custom flows |

---

## 9. Constraints

| Constraint | Detail |
|------------|--------|
| **Budget** | ₹0 upfront cost until revenue |
| **Team** | Solo founder |
| **Geography** | India-first (UPI, INR, Indian languages) |
| **Free Tier Dependency** | All services must run on free tiers until paying users |
| **Vercel Timeout** | Serverless functions limited to 60s → paginate cron jobs |
| **DPDP Compliance** | Mandatory from day 1 (consent, deletion, retention) |
| **No WhatsApp Cloud API for sending** | Cost savings + relationship preservation via deep links |

---

## 10. Out of Scope (MVP)

- Tally/Zoho Books integration (planned for v2)
- Full multi-user team access with data migration (schema only — planned for v2)
- Voice call reminders (planned for v3)
- Legal escalation / auto-generate notices (planned for v3)
- Credit scoring database (planned for v3)
- Mobile app (planned for v4)
- API for third-party platforms (planned for v3)
- LLM-powered message generation (planned for v2)
- Auto-send capability (explicitly out of scope — core product principle)
- Partial payment handling (planned for v2)

---

## 11. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User doesn't approve drafts | Medium | High | Make editing easy in dashboard, learn from edits to improve drafts |
| Draft quality too low | Medium | High | Start with proven templates, iterate based on approval rate data |
| Razorpay webhook failures | Low | Medium | Polling fallback, UNIQUE constraint |
| DPDP non-compliance | Low | High | Consent tracking, data minimization, legal review |
| Competitor launches | Medium | Medium | First-mower advantage, UX focus on approval workflow |
| User churn | Medium | High | Show ROI immediately in dashboard, track approval rate trends |
| Vercel timeout on cron | Medium | Medium | Paginate at 100 invoices/batch |
| User forgets to check drafts | Medium | Medium | Email notification when new drafts are ready |
| wa.me link fails on mobile | Low | Low | Fallback to copy-to-clipboard with WhatsApp open intent |

---

## 12. Go-to-Market Strategy

### Phase 1 (Month 1-2): Direct Outreach
- LinkedIn DMs to agency owners
- Twitter/X threads about payment recovery without relationship damage
- Reddit posts in r/India, r/developersIndia, r/freelance
- WhatsApp business groups

### Phase 2 (Month 2-4): Content Marketing
- YouTube: "How to recover stuck payments without ruining relationships"
- Blog: "AI-drafted payment follow-ups that preserve client trust"
- Case studies: "How Agency X recovered ₹4.2L in 30 days without a single awkward conversation"

### Phase 3 (Month 4-6): CA Partnerships
- Partner with CA firms (100-500 clients each)
- 30% commission on referrals
- White-label option

### Phase 4 (Month 6+): Referral Engine
- "Refer another business, get 1 month free"
- In-app referral prompts after recoveries

---

## 13. Implementation Status

All P0 (MVP) and P1 features are **complete**. P2 features are in progress.

| Task | Status | Notes |
|------|--------|-------|
| Project Setup | ✅ Done | Next.js 14 + TypeScript + Tailwind |
| Dependencies | ✅ Done | Supabase, Razorpay, Resend, Upstash, lucide-react, zod, papaparse |
| Database Schema | ✅ Done | 12 tables, 13 indexes, RLS on all tables, triggers |
| Environment Config | ✅ Done | .env.example + .env.local |
| Supabase Client | ✅ Done | Browser, server, middleware, types |
| Auth Pages | ✅ Done | Login, signup, forgot/reset password, callback |
| Dashboard Layout | ✅ Done | Sidebar, overview page, onboarding flow |
| AI Engine | ✅ Done | Template-based message generation with 3 escalation levels, 3 style presets |
| WhatsApp Deep Links | ✅ Done | wa.me link generation in approval flow |
| Draft Approval Queue | ✅ Done | Full CRON → draft → review → approve → send flow |
| Razorpay Integration | ✅ Done | Payment link generation, webhook handler |
| Webhook Handlers | ✅ Done | Razorpay payment.captured with signature verification |
| Client CRUD | ✅ Done | Add, edit, delete with consent tracking (DPDP) |
| Invoice CRUD | ✅ Done | Create, edit, delete, status tracking, UPI links |
| CSV Import | ✅ Done | 6-column CSV with per-field validation, client auto-creation, duplicate detection, error report |
| Client Risk Cards | ✅ Done | Visual cards with risk score, outstanding, delay, on-time rate |
| Client Activity Log | ✅ Done | Timeline of invoice/reminder events with icons, tabs on detail page |
| Custom Message Templates | ✅ Done | Variable-based templates with preview, per language/escalation level |
| Delivery Status Tracking | ✅ Done | Manual mark as sent/delivered/replied per draft |
| Email Reminders | ✅ Done | Resend integration with fallback when no WhatsApp number |
| Multilingual Support | ✅ Done | 5 languages: English, Hindi, Tamil, Telugu, Bengali |
| Payment Reconciliation | ✅ Done | Manual + auto-match via Razorpay webhook, reconciliation dashboard |
| Bulk Invoice Actions | ✅ Done | Multi-select checkboxes, batch mark paid, batch generate drafts |
| Organization Schema | ✅ Done | Tables + RLS — full team mode deferred to later |
| Rate Limiting | ✅ Done | 100 req/min per user via Upstash Redis |
| ISR Caching | ✅ Done | 5-min revalidate on all dashboard pages |
| Sentry Error Monitoring | ✅ Done | Global error boundary + Sentry SDK integration |
| Vercel Config | ✅ Done | vercel.json with build/install commands |
| CI/CD | ✅ Done | GitHub Actions: lint+test on push/PR, auto-deploy on master |
| UI Primitives | ✅ Done | EmptyState, Skeleton, Toaster, Toasts on mutations |
| Cron Jobs | ✅ Done | Daily 6 AM draft generation, payment reconciliation every 30 min |
| Tests | ✅ Done | 168 tests across 16 suites — all passing |
| Lint | ✅ Done | Zero warnings or errors |
| Deployment | ⏳ Pending | Requires VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID in GitHub secrets |

---

## 14. Open Questions

1. **Draft Editing UX:** Should users be able to edit drafts inline in the dashboard, or is approve/dismiss enough for MVP?
2. **Email Notification for Drafts:** Should we notify users via email when new drafts are ready, or rely on dashboard visits?
3. **Response Tracking:** How do we track whether a client responded after the user sends a message? Manual logging vs. WhatsApp Business API read receipts?
4. **Data Retention Policy:** Is 3 years the correct retention period for consent logs under DPDP?
5. **Multi-language Templates:** Which 5 Indian languages should be prioritized for v1?
6. **Style Preset Defaults:** Should we recommend a default style (professional) during onboarding, or force user to choose?

---

## 15. Appendices

### A. Database Schema Summary
- 12 tables: users, clients, invoices, reminders, message_drafts, payments, ai_predictions, consent_log, audit_log, client_events, custom_templates, payment_transactions, organizations, organization_members
- 13 indexes for query performance
- 15 RLS policies for data isolation
- 1 trigger for payment amount validation

### B. Environment Variables (10 total)
- Supabase: 3 vars
- Razorpay: 3 vars
- Resend: 1 var
- Upstash: 2 vars
- Note: WhatsApp Cloud API credentials removed (no longer needed for sending)

### C. Key Dependencies
- @supabase/supabase-js, @supabase/ssr
- razorpay, resend, @upstash/redis, @upstash/ratelimit
- lucide-react, zod, papaparse
- react-hot-toast, @sentry/nextjs
- jest, @testing-library/react
