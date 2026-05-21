# PayChase AI — Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** 2026-05-21  
**Status:** Draft  
**Author:** opencode (AI-assisted)

---

## 1. Problem Statement

Indian freelancers and small agencies lose 15-30 days of cash flow due to delayed payments. They spend 5-10 hours per week manually chasing payments via phone calls and WhatsApp messages. They lack:

- Visibility into **which clients will pay late**
- Guidance on **when to follow up**
- Predictability of **how much money to expect next month**
- A **systematic, automated** way to send reminders without damaging relationships

---

## 2. Product Vision

**PayChase AI** is a WhatsApp-first, AI-powered payment collection platform that automates payment reminders, predicts late-paying clients, and provides cash flow forecasting — all through a simple web dashboard and WhatsApp integration.

**North Star Metric:** Reduce average payment collection time by 15 days.

---

## 3. Target Users

### Primary: Freelancers & Consultants
- 1-5 people
- Revenue: ₹5L-₹50L/year
- Willingness to pay: ₹500-₹2,000/month
- Pain: Chasing payments takes time away from billable work

### Secondary: Small Agencies
- 5-20 people (marketing, design, dev shops)
- Revenue: ₹50L-₹5Cr/year
- Willingness to pay: ₹2,000-₹5,000/month
- Pain: Multiple team members chasing multiple clients, no visibility into cash flow

---

## 4. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Avg collection time reduction | -15 days | Dashboard analytics |
| Payment recovery rate improvement | +40% vs manual | A/B comparison |
| Time saved per user | 5+ hours/week | User survey |
| 3-month retention | 80%+ | Cohort analysis |
| WhatsApp delivery rate | 95%+ | Webhook tracking |
| UPI payment click-through | 30%+ | Razorpay analytics |

---

## 5. Feature Requirements

### 5.1 Authentication & Onboarding

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| AUTH-1 | Email/Password Signup | P0 | Supabase Auth with email verification |
| AUTH-2 | Login | P0 | Email/password login with session management |
| AUTH-3 | Forgot Password | P1 | Password reset via email link |
| ONB-1 | Company Setup | P1 | Collect company name, phone, industry during first login |
| ONB-2 | First Client Import | P1 | Guided flow to add first client or upload CSV |

### 5.2 Client Management

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| CLI-1 | Add Client | P0 | Manual form: name, phone, email, industry |
| CLI-2 | Edit Client | P0 | Update client details |
| CLI-3 | Delete Client | P1 | Cascading delete (invoices, reminders, payments) |
| CLI-4 | Client List | P0 | Sortable, filterable table with risk score badges |
| CLI-5 | Client Risk Cards | P0 | Visual cards showing risk score, outstanding, avg delay, on-time rate, best contact time |
| CLI-6 | CSV Import | P1 | Upload CSV with pre-flight validation, partial import, error report |
| CLI-7 | Consent Tracking | P0 | DPDP-compliant consent checkbox on client creation, logged in consent_log table |

### 5.3 Invoice Management

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| INV-1 | Create Invoice | P0 | Manual form: client, number, amount, issue date, due date |
| INV-2 | Edit Invoice | P0 | Update invoice details |
| INV-3 | Invoice List | P0 | Filterable by status (pending, paid, overdue), sortable |
| INV-4 | Bulk Actions | P1 | Select multiple invoices, send reminders, mark paid |
| INV-5 | Invoice Status Tracking | P0 | Auto-update on payment webhook |
| INV-6 | UPI Link Generation | P0 | Auto-generate Razorpay payment link on invoice creation |

### 5.4 AI Engine

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| AI-1 | Risk Scoring (v1) | P0 | Rule-based scoring: on_time_rate, avg_delay, overdue days, new client uncertainty |
| AI-2 | Payment Date Prediction | P0 | Predict when client will pay based on historical avg delay |
| AI-3 | Confidence Intervals | P1 | ±7 day confidence window around predicted date |
| AI-4 | Smart Timing | P1 | Calculate optimal send hour from WhatsApp read/responded timestamps |
| AI-5 | Sentiment Templates | P0 | Friendly/professional/firm tone based on client on_time_rate |
| AI-6 | ML Upgrade Path (v2) | P2 | Random Forest model after 100+ payment records, retrained weekly |

### 5.5 Messaging & Reminders

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| MSG-1 | WhatsApp Reminders | P0 | Send via Meta WhatsApp Cloud API using approved utility templates |
| MSG-2 | Email Reminders | P1 | Fallback via Resend when WhatsApp unavailable |
| MSG-3 | Multilingual Support | P1 | Templates in English, Hindi, Tamil, Telugu, Bengali |
| MSG-4 | Reminder Scheduling | P0 | Cron-based dispatch every 2 hours, respects optimal send hour |
| MSG-5 | Channel Selection | P1 | Auto-select WhatsApp or email based on client preference and availability |
| MSG-6 | Delivery Tracking | P0 | Track delivered_at, read_at, responded_at via WhatsApp webhooks |
| MSG-7 | Fallback Logic | P1 | Invalid WhatsApp number → email fallback |

### 5.6 Payments

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| PAY-1 | Razorpay Integration | P0 | Create payment links, embed in reminders |
| PAY-2 | Webhook Handler | P0 | Idempotent payment capture via UNIQUE constraint on razorpay_payment_id |
| PAY-3 | Payment Recording | P0 | Auto-record payment, mark invoice paid, update AI model |
| PAY-4 | Payment Reconciliation | P1 | Cron job every 30 min to catch missed webhooks |
| PAY-5 | Partial Payments | P2 | Support partial payment against invoice amount |

### 5.7 Dashboard

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| DASH-1 | Overview Page | P0 | Total outstanding, cash flow forecast, recovery rate, avg collection time |
| DASH-2 | Client Risk Page | P0 | Risk cards with sort/filter by risk score |
| DASH-3 | Invoice Manager | P0 | Full CRUD with filters, bulk actions, CSV upload |
| DASH-4 | AI Insights Page | P0 | Late payment predictions, optimal collection day, at-risk amounts |
| DASH-5 | Recovery Analytics | P1 | DSO trends, recovery rates, channel effectiveness |
| DASH-6 | ISR Caching | P1 | 5-min revalidate, tag-based invalidation on data changes |

### 5.8 Compliance & Security

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| SEC-1 | Row-Level Security | P0 | All 8 tables scoped to user_id via Supabase RLS |
| SEC-2 | DPDP Consent Log | P0 | Audit trail of all consent events |
| SEC-3 | Data Deletion | P1 | One-click cascading delete for client data |
| SEC-4 | Data Export | P1 | Export client/invoice data as JSON/CSV |
| SEC-5 | Rate Limiting | P1 | 100 req/min per user via Upstash Redis |
| SEC-6 | Data Retention | P2 | Delete consent logs after 3 years |

---

## 6. Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| **Performance** | Dashboard page load | < 2s (ISR cached) |
| **Performance** | API response time | < 500ms (p95) |
| **Performance** | Cron job execution | < 60s (paginated, 100/batch) |
| **Scalability** | Max users (free tier) | 10K users |
| **Scalability** | Max invoices/user | 500 (free), 5000 (paid) |
| **Reliability** | WhatsApp delivery | 95%+ (with email fallback) |
| **Reliability** | Webhook idempotency | 100% (UNIQUE constraint) |
| **Availability** | Uptime target | 99.5% (Vercel free tier) |
| **Security** | Auth | Supabase Auth (JWT) |
| **Security** | Data isolation | RLS on all tables |
| **Compliance** | DPDP Act 2023 | Consent tracking, data minimization, deletion rights |

---

## 7. Technical Architecture

### 7.1 Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend + API | Next.js 14 (App Router, TypeScript) | Single codebase, serverless, Vercel hosting |
| Database | Supabase (PostgreSQL + RLS) | Free tier generous, auth included, row-level security |
| WhatsApp | Meta WhatsApp Cloud API (direct) | First 1,000 service conversations free, no BSP markup |
| Email | Resend | 3,000 emails/month free |
| AI | Rule-based v1 → Random Forest v2 | Free, debuggable, sufficient for v1 |
| Payments | Razorpay | UPI links, webhooks, 2% per transaction |
| Hosting | Vercel | Free tier: 100GB bandwidth, serverless, cron |
| Rate Limiting | Upstash Redis | 10K requests/day free |

### 7.2 Cron Jobs

| Job | Schedule | Pagination | Purpose |
|-----|----------|------------|---------|
| AI Predictions | Daily 6 AM IST | 100 clients/batch | Score all clients, update risk |
| Reminder Dispatch | Every 2 hours | 50 reminders/batch | Send scheduled reminders |
| Payment Reconciliation | Every 30 min | N/A | Catch missed webhooks |
| Model Retraining | Weekly Sunday 2 AM | N/A | Retrain v2 model (future) |
| Consent Cleanup | Monthly 1st 3 AM | 100 records/batch | Delete old consent logs |

### 7.3 Data Flow

```
User signs up → Supabase Auth → RLS isolates data
User uploads invoices → CSV validated → Clients created/updated
Vercel Cron (6 AM) → AI scores clients → Updates risk scores
Reminder Scheduler (2hr) → Selects channel → Renders template → Sends
WhatsApp Webhook → Tracks delivery/read/reply → Updates timing data
Client pays via UPI → Razorpay webhook (idempotent) → Invoice marked paid
Dashboard refreshes (ISR 5-min) → Shows updated metrics
```

---

## 8. Pricing Tiers

| Tier | Price | Invoices | Features |
|------|-------|----------|----------|
| **Free** | ₹0/month | 10 | Basic reminders, no AI |
| **Starter** | ₹999/month | 50 | WhatsApp + Email, AI predictions |
| **Growth** | ₹2,999/month | 500 | Smart timing, multilingual, UPI links |
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
| **WhatsApp Template Approval** | Utility templates require Meta approval before use |
| **DPDP Compliance** | Mandatory from day 1 (consent, deletion, retention) |

---

## 10. Out of Scope (MVP)

- Tally/Zoho Books integration (planned for v2)
- Multi-user team access (planned for v2)
- Voice call reminders (planned for v3)
- Legal escalation / auto-generate notices (planned for v3)
- Credit scoring database (planned for v3)
- Mobile app (planned for v4)
- API for third-party platforms (planned for v3)

---

## 11. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| WhatsApp rate limits | Medium | Low | Batch messages, respect 24-hour window |
| Razorpay webhook failures | Low | Medium | Polling fallback, UNIQUE constraint |
| AI inaccurate early | High | Low | Rule-based is deterministic, not probabilistic |
| DPDP non-compliance | Low | High | Consent tracking, data minimization, legal review |
| Competitor launches | Medium | Medium | First-mover advantage, UX focus |
| User churn | Medium | High | Show ROI immediately in dashboard |
| Vercel timeout on cron | Medium | Medium | Paginate at 100 clients/batch |
| Template rejection by Meta | Medium | Low | Fallback templates, re-apply with changes |

---

## 12. Go-to-Market Strategy

### Phase 1 (Month 1-2): Direct Outreach
- LinkedIn DMs to agency owners
- Twitter/X threads about payment recovery
- Reddit posts in r/India, r/developersIndia, r/freelance
- WhatsApp business groups

### Phase 2 (Month 2-4): Content Marketing
- YouTube: "How to recover stuck payments without ruining relationships"
- Blog: "AI payment prediction for Indian businesses"
- Case studies: "How Agency X recovered ₹4.2L in 30 days"

### Phase 3 (Month 4-6): CA Partnerships
- Partner with CA firms (100-500 clients each)
- 30% commission on referrals
- White-label option

### Phase 4 (Month 6+): Referral Engine
- "Refer another business, get 1 month free"
- In-app referral prompts after recoveries

---

## 13. Implementation Status

| Task | Status | Notes |
|------|--------|-------|
| Project Setup | ✅ Done | Next.js 14 + TypeScript + Tailwind |
| Dependencies | ✅ Done | Supabase, Razorpay, Resend, Upstash, lucide-react, zod |
| Database Schema | ✅ Done | 8 tables, 12 indexes, RLS, triggers |
| Environment Config | ✅ Done | .env.example + .env.local |
| Supabase Client | ✅ Done | Browser, server, middleware, types |
| Auth Pages | ✅ Done | Login, signup, forgot/reset password, callback |
| Dashboard Layout | ✅ Done | Sidebar, overview page, loading state |
| AI Engine | ✅ Done | Risk scoring, smart timing, sentiment templates (34 tests) |
| WhatsApp API | ✅ Done | Client, template builder, tests (5 tests) |
| Razorpay Integration | ⏳ Pending | |
| Webhook Handlers | ⏳ Pending | WhatsApp + Razorpay |
| Client CRUD | ⏳ Pending | |
| Invoice CRUD | ⏳ Pending | |
| CSV Import | ⏳ Pending | |
| Cron Jobs | ⏳ Pending | |
| Rate Limiting | ⏳ Pending | |
| ISR Caching | ⏳ Pending | |
| Tests (Integration/E2E) | ⏳ Pending | |

---

## 14. Open Questions

1. **WhatsApp Template Approval:** What is the current approval timeline for utility templates in India?
2. **Razorpay Onboarding:** What documents are required for a new Indian business to get Razorpay API keys?
3. **Supabase Auth Email:** Should we use Supabase's default email templates or custom ones via Resend?
4. **Data Retention Policy:** Is 3 years the correct retention period for consent logs under DPDP?
5. **Multi-language Templates:** Which 5 Indian languages should be prioritized for v1?

---

## 15. Appendices

### A. Database Schema Summary
- 8 tables: users, clients, invoices, reminders, payments, ai_predictions, consent_log, audit_log
- 12 indexes for query performance
- 8 RLS policies for data isolation
- 1 trigger for payment amount validation

### B. Environment Variables (12 total)
- Supabase: 3 vars
- WhatsApp: 3 vars
- Razorpay: 3 vars
- Resend: 1 var
- Upstash: 2 vars

### C. Key Dependencies
- @supabase/supabase-js, @supabase/ssr
- razorpay, resend, @upstash/redis
- lucide-react, zod, csv-parse
- jest, @testing-library/react
