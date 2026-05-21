# PayChase AI

> WhatsApp-first, AI-powered payment collection for Indian freelancers and small agencies.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Problem

Indian businesses lose **15-30 days of cash flow** due to delayed payments. Freelancers and small agencies spend **5-10 hours/week** manually chasing payments via phone calls and WhatsApp. They don't know:

- Which clients will pay late
- When to follow up
- How much money to expect next month

## Solution

PayChase AI automates payment reminders through WhatsApp, predicts which clients will pay late using AI, and provides cash flow forecasting — all through a simple dashboard.

### Key Features

- **AI Risk Scoring** — Predicts payment delays using rule-based scoring (v1) with ML upgrade path (v2)
- **WhatsApp Reminders** — Automated, multilingual reminders via Meta WhatsApp Cloud API
- **Smart Timing** — Learns optimal send times from client response patterns
- **Sentiment-Aware Messages** — Friendly, professional, or firm tone based on client history
- **UPI Payment Links** — Razorpay integration for instant UPI payments
- **Cash Flow Forecast** — Predict incoming revenue with confidence intervals
- **DPDP Compliant** — Consent tracking, data deletion, and retention policies from day 1

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend + API** | Next.js 14 (App Router, TypeScript) |
| **Database** | Supabase (PostgreSQL + Row-Level Security) |
| **WhatsApp** | Meta WhatsApp Cloud API (direct) |
| **Email** | Resend |
| **AI** | Rule-based scoring v1 → Random Forest v2 |
| **Payments** | Razorpay (UPI links + webhooks) |
| **Hosting** | Vercel |
| **Rate Limiting** | Upstash Redis |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER DASHBOARD (Next.js)                     │
│                   (ISR cached, 5-min revalidate)                │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 💰 Cash  │ │ 📊 Client│ │ 🤖 AI    │ │ 📱 Whats │ │          │
│  │  Flow    │ │  Risk    │ │ Insights │ │  App     │ │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 📄 Invoice│ │ 🔄 Tally │ │ 📈 Recovery│ │ ⚙️ Settings│ │          │
│  │  Manager │ │  /Zoho   │ │ Analytics │ │          │ │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
              Next.js API Routes + Vercel Cron + Rate Limiting
                               │
       ┌───────────────────────┼───────────────────────────────┐
       │                       │                               │
  ┌────▼─────┐          ┌──────▼──────┐                ┌───────▼───────┐
  │ Supabase │          │ AI Engine   │                │  Messaging    │
  │ (Postgres│          │ (Node.js)   │                │  Orchestrator │
  │  + RLS)  │          │             │                │               │
  │ • Users  │          │ • Rule-based│                │ • WhatsApp    │
  │ • Clients│          │   scoring   │                │   Cloud API   │
  │ • Invoice│          │ • Smart     │                │ • Resend      │
  │ • Payment│          │   timing    │                │ • Razorpay    │
  │ • Consent│          │ • Sentiment │                │   (UPI)       │
  └──────────┘          └─────────────┘                └───────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A Supabase project
- Meta WhatsApp Cloud API credentials
- Razorpay account
- Resend account (optional, for email fallback)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/paychase-ai.git
   cd paychase-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # WhatsApp Cloud API
   WHATSAPP_ACCESS_TOKEN=your-access-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token

   # Resend (Email)
   RESEND_API_KEY=your-resend-api-key

   # Razorpay (Payments)
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret
   RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

   # Upstash Redis (Rate Limiting)
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-redis-token
   ```

4. **Run database migrations**
   ```bash
   # Apply the migration to your Supabase project via the SQL editor
   # or using the Supabase CLI:
   supabase db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Project Structure

```
paychase-ai/
├── app/
│   ├── (auth)/                    # Auth route group
│   │   ├── login/page.tsx         # Login page
│   │   ├── signup/page.tsx        # Signup page
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/               # Dashboard route group
│   │   ├── layout.tsx             # Dashboard layout with sidebar
│   │   ├── page.tsx               # Overview page
│   │   ├── clients/page.tsx       # Client management
│   │   ├── invoices/page.tsx      # Invoice management
│   │   ├── insights/page.tsx      # AI insights
│   │   └── analytics/page.tsx     # Recovery analytics
│   ├── api/
│   │   ├── webhooks/
│   │   │   ├── whatsapp/route.ts  # WhatsApp webhook handler
│   │   │   └── razorpay/route.ts  # Razorpay webhook handler
│   │   └── cron/
│   │       ├── ai-predictions/route.ts
│   │       ├── reminder-dispatch/route.ts
│   │       └── payment-reconciliation/route.ts
│   └── auth/callback/route.ts     # Supabase auth callback
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   ├── server.ts              # Server Supabase client
│   │   ├── middleware.ts          # Session middleware
│   │   └── types.ts               # Database TypeScript types
│   ├── ai/
│   │   ├── risk-scoring.ts        # Rule-based risk scoring
│   │   ├── smart-timing.ts        # Optimal send hour calculation
│   │   ├── sentiment-templates.ts # Tone-aware message templates
│   │   └── __tests__/             # AI engine tests
│   ├── whatsapp/
│   │   ├── client.ts              # WhatsApp Cloud API client
│   │   ├── templates.ts           # Template message builder
│   │   └── templates.test.ts      # WhatsApp tests
│   ├── razorpay/                  # Razorpay integration
│   ├── email/                     # Resend email integration
│   └── rate-limit.ts              # Upstash Redis rate limiting
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # Database schema
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── dashboard/                 # Dashboard-specific components
│   └── forms/                     # Reusable form components
├── .env.example                   # Environment template
├── .env.local                     # Local secrets (gitignored)
└── middleware.ts                  # Next.js middleware
```

## Database Schema

8 tables with Row-Level Security:

| Table | Purpose |
|-------|---------|
| `users` | User accounts and plan info |
| `clients` | Clients who owe money (with risk scores) |
| `invoices` | Invoice records with payment status |
| `reminders` | Sent reminders with delivery tracking |
| `payments` | Payment records from Razorpay |
| `ai_predictions` | AI prediction history |
| `consent_log` | DPDP consent audit trail |
| `audit_log` | System audit log |

See `supabase/migrations/001_initial_schema.sql` for the full schema.

## AI Engine

### v1: Rule-Based Scoring (Current)

Deterministic scoring based on:
- Client on-time payment rate
- Average payment delay
- Days overdue
- Number of historical invoices

```typescript
// Example output
{
  risk_score: 0.75,           // 0.0 (safe) to 1.0 (high risk)
  predicted_payment_date: "2026-06-15",
  confidence_interval: ["2026-06-08", "2026-06-22"]
}
```

### v2: Random Forest (Planned)

- Activates after 100+ payment records
- Retrained weekly via cron job
- Features: historical payment patterns, industry, invoice amount, seasonality

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| AI Predictions | Daily 6 AM IST | Score all clients, update risk |
| Reminder Dispatch | Every 2 hours | Send scheduled reminders |
| Payment Reconciliation | Every 30 min | Catch missed webhooks |
| Model Retraining | Weekly Sunday 2 AM | Retrain v2 model (future) |
| Consent Cleanup | Monthly 1st 3 AM | Delete old consent logs |

All cron jobs are paginated (100 records/batch) to avoid Vercel's 60s serverless timeout.

## Pricing

| Tier | Price | Invoices | Features |
|------|-------|----------|----------|
| **Free** | ₹0/month | 10 | Basic reminders, no AI |
| **Starter** | ₹999/month | 50 | WhatsApp + Email, AI predictions |
| **Growth** | ₹2,999/month | 500 | Smart timing, multilingual, UPI links |
| **Business** | ₹7,999/month | Unlimited | Tally/Zoho sync, team access, custom flows |

## Development

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
npm run test      # Run tests
```

### Running Tests

```bash
# All tests
npm run test

# Specific test file
npx jest src/lib/ai/__tests__/risk-scoring.test.ts
```

### Code Quality

```bash
npm run lint      # ESLint
npx tsc --noEmit  # TypeScript type check
```

## DPDP Compliance

PayChase AI is designed to comply with India's Digital Personal Data Protection (DPDP) Act 2023:

- **Consent tracking:** Every client has a `consent_given` flag and full audit trail in `consent_log`
- **Data minimization:** Only collect necessary client data
- **Right to deletion:** One-click cascading delete removes all client data
- **Data export:** Users can export their data as JSON/CSV
- **Privacy notice:** Every reminder includes a privacy policy link
- **Retention policy:** Consent logs auto-deleted after 3 years

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT — see [LICENSE](LICENSE) for details.

## Contact

- **Website:** [paychase.ai](https://paychase.ai) (coming soon)
- **Twitter:** [@paychaseai](https://twitter.com/paychaseai) (coming soon)
- **Email:** hello@paychase.ai
