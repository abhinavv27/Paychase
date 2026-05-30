# PayChase AI

> AI-drafted payment follow-ups you approve and send from your own WhatsApp.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## Problem

Chasing payments is awkward. You don't want to damage client relationships, but you also need to get paid. The result: you delay sending follow-ups, messages come across too harsh or too soft, and money stays stuck for 15-30 days longer than it should.

Freelancers and small agencies in India lose **15-30 days of cash flow** due to delayed payments. They spend **5-10 hours/week** thinking about what to say, when to say it, and then actually sending the message. They don't know:

- What tone to strike without ruining the relationship
- When to escalate from gentle to firm
- How to be consistent without being annoying
- Which clients need a nudge vs. which will pay on their own

## Solution

PayChase AI removes the awkwardness of chasing payments. Every day, our AI generates personalized follow-up drafts based on each client's payment history, relationship context, and escalation level. You review each draft in 10 seconds, tweak if needed, and send it from your own WhatsApp number via a deep link.

**Messages are NEVER sent automatically.** You always review and approve. The AI writes, you decide.

### Key Features

- **AI-Drafted Messages** ΓÇö Relationship-aware follow-ups with escalation levels (gentle/firm/urgent) and your personal style (casual/professional/formal)
- **You Review, You Send** ΓÇö Every draft requires your approval. Messages are NEVER auto-sent
- **WhatsApp Deep Links** ΓÇö One-click `wa.me` links open WhatsApp with the message pre-filled. You hit send from your own number
- **Approval Workflow** ΓÇö Cron generates drafts overnight ΓåÆ you see them in your dashboard ΓåÆ approve with one click ΓåÆ opens WhatsApp ready to send
- **Response History Awareness** ΓÇö AI knows if the client replied, promised to pay, or went silent ΓÇö and adjusts the next draft accordingly
- **UPI Payment Links** ΓÇö Razorpay integration for instant UPI payments embedded in messages
- **Cash Flow Forecast** ΓÇö Predict incoming revenue with confidence intervals
- **DPDP Compliant** ΓÇö Consent tracking, data deletion, and retention policies from day 1

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend + API** | Next.js 14 (App Router, TypeScript) |
| **Database** | Supabase (PostgreSQL + Row-Level Security) |
| **WhatsApp** | wa.me deep links (user sends from their own number) |
| **Email** | Resend |
| **AI** | Message generation engine with escalation logic |
| **Payments** | Razorpay (UPI links + webhooks) |
| **Hosting** | Vercel |
| **Rate Limiting** | Upstash Redis |

## Architecture

```
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé                    USER DASHBOARD (Next.js)                     Γöé
Γöé                   (ISR cached, 5-min revalidate)                Γöé
Γöé                                                                 Γöé
Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ          Γöé
Γöé  Γöé ≡ƒÆ░ Cash  Γöé Γöé ≡ƒôè ClientΓöé Γöé ≡ƒñû AI    Γöé Γöé Γ£à Draft Γöé Γöé          Γöé
Γöé  Γöé  Flow    Γöé Γöé  Risk    Γöé Γöé Drafts   Γöé Γöé  Approve Γöé Γöé          Γöé
Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ          Γöé
Γöé                                                                 Γöé
Γöé  ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ          Γöé
Γöé  Γöé ≡ƒôä InvoiceΓöé Γöé ≡ƒöä Tally Γöé Γöé ≡ƒôê RecoveryΓöé Γöé ΓÜÖ∩╕Å SettingsΓöé Γöé          Γöé
Γöé  Γöé  Manager Γöé Γöé  /Zoho   Γöé Γöé Analytics Γöé Γöé          Γöé Γöé          Γöé
Γöé  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ          Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                               Γöé
              Next.js API Routes + Vercel Cron + Rate Limiting
                               Γöé
       ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
       Γöé                       Γöé                               Γöé
  ΓöîΓöÇΓöÇΓöÇΓöÇΓû╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ          ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓû╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ                ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓû╝ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
  Γöé Supabase Γöé          Γöé AI Draft    Γöé                Γöé  WhatsApp     Γöé
  Γöé (PostgresΓöé          Γöé Engine      Γöé                Γöé  Deep Links   Γöé
  Γöé  + RLS)  Γöé          Γöé             Γöé                Γöé               Γöé
  Γöé ΓÇó Users  Γöé          Γöé ΓÇó EscalationΓöé                Γöé ΓÇó wa.me links Γöé
  Γöé ΓÇó ClientsΓöé          Γöé   levels    Γöé                Γöé ΓÇó User's own  Γöé
  Γöé ΓÇó InvoiceΓöé          Γöé ΓÇó Style     Γöé                Γöé   number      Γöé
  Γöé ΓÇó PaymentΓöé          Γöé   presets   Γöé                Γöé ΓÇó Razorpay    Γöé
  Γöé ΓÇó Drafts Γöé          Γöé ΓÇó Response  Γöé                Γöé   (UPI)       Γöé
  ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ          Γöé   history   Γöé                ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
                        ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ

  FLOW:
  1. Cron ΓåÆ AI Draft Engine generates message drafts
  2. Drafts stored in Supabase ΓåÆ appear in dashboard
  3. User reviews + approves draft
  4. Approved ΓåÆ wa.me link opens WhatsApp with pre-filled message
  5. User hits send from their own number
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- A Supabase project
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

   # Resend (Email)
   RESEND_API_KEY=your-resend-api-key

   # Razorpay (Payments)
   RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-secret
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
Γö£ΓöÇΓöÇ app/
Γöé   Γö£ΓöÇΓöÇ (auth)/                    # Auth route group
Γöé   Γöé   Γö£ΓöÇΓöÇ login/page.tsx         # Login page
Γöé   Γöé   Γö£ΓöÇΓöÇ signup/page.tsx        # Signup page
Γöé   Γöé   Γö£ΓöÇΓöÇ forgot-password/page.tsx
Γöé   Γöé   ΓööΓöÇΓöÇ reset-password/page.tsx
Γöé   Γö£ΓöÇΓöÇ (dashboard)/               # Dashboard route group
Γöé   Γöé   Γö£ΓöÇΓöÇ layout.tsx             # Dashboard layout with sidebar
Γöé   Γöé   Γö£ΓöÇΓöÇ page.tsx               # Overview page
Γöé   Γöé   Γö£ΓöÇΓöÇ clients/page.tsx       # Client management
Γöé   Γöé   Γö£ΓöÇΓöÇ invoices/page.tsx      # Invoice management
Γöé   Γöé   Γö£ΓöÇΓöÇ drafts/page.tsx        # AI draft approval queue
Γöé   Γöé   Γö£ΓöÇΓöÇ insights/page.tsx      # AI insights
Γöé   Γöé   ΓööΓöÇΓöÇ analytics/page.tsx     # Recovery analytics
Γöé   Γö£ΓöÇΓöÇ api/
Γöé   Γöé   Γö£ΓöÇΓöÇ webhooks/
Γöé   Γöé   Γöé   ΓööΓöÇΓöÇ razorpay/route.ts  # Razorpay webhook handler
Γöé   Γöé   ΓööΓöÇΓöÇ cron/
Γöé   Γöé       Γö£ΓöÇΓöÇ ai-drafts/route.ts       # Generate message drafts
Γöé   Γöé       ΓööΓöÇΓöÇ payment-reconciliation/route.ts
Γöé   ΓööΓöÇΓöÇ auth/callback/route.ts     # Supabase auth callback
Γö£ΓöÇΓöÇ lib/
Γöé   Γö£ΓöÇΓöÇ supabase/
Γöé   Γöé   Γö£ΓöÇΓöÇ client.ts              # Browser Supabase client
Γöé   Γöé   Γö£ΓöÇΓöÇ server.ts              # Server Supabase client
Γöé   Γöé   Γö£ΓöÇΓöÇ middleware.ts          # Session middleware
Γöé   Γöé   ΓööΓöÇΓöÇ types.ts               # Database TypeScript types
Γöé   Γö£ΓöÇΓöÇ ai/
Γöé   Γöé   Γö£ΓöÇΓöÇ draft-generator.ts     # AI message draft generation
Γöé   Γöé   Γö£ΓöÇΓöÇ escalation-logic.ts    # Gentle ΓåÆ firm ΓåÆ urgent escalation
Γöé   Γöé   Γö£ΓöÇΓöÇ style-presets.ts       # Casual / professional / formal
Γöé   Γöé   Γö£ΓöÇΓöÇ response-history.ts    # Client response awareness
Γöé   Γöé   ΓööΓöÇΓöÇ __tests__/             # AI engine tests
Γöé   Γö£ΓöÇΓöÇ whatsapp/
Γöé   Γöé   Γö£ΓöÇΓöÇ deep-link.ts           # wa.me link generator
Γöé   Γöé   ΓööΓöÇΓöÇ deep-link.test.ts      # Deep link tests
Γöé   Γö£ΓöÇΓöÇ razorpay/                  # Razorpay integration
Γöé   Γö£ΓöÇΓöÇ email/                     # Resend email integration
Γöé   ΓööΓöÇΓöÇ rate-limit.ts              # Upstash Redis rate limiting
Γö£ΓöÇΓöÇ supabase/
Γöé   ΓööΓöÇΓöÇ migrations/
Γöé       ΓööΓöÇΓöÇ 001_initial_schema.sql # Database schema
Γö£ΓöÇΓöÇ components/
Γöé   Γö£ΓöÇΓöÇ ui/                        # shadcn/ui components
Γöé   Γö£ΓöÇΓöÇ dashboard/                 # Dashboard-specific components
Γöé   ΓööΓöÇΓöÇ forms/                     # Reusable form components
Γö£ΓöÇΓöÇ .env.example                   # Environment template
Γö£ΓöÇΓöÇ .env.local                     # Local secrets (gitignored)
ΓööΓöÇΓöÇ middleware.ts                  # Next.js middleware
```

## Database Schema

9 tables with Row-Level Security:

| Table | Purpose |
|-------|---------|
| `users` | User accounts and plan info |
| `clients` | Clients who owe money (with risk scores) |
| `invoices` | Invoice records with payment status |
| `reminders` | Sent reminders with delivery tracking |
| `message_drafts` | AI-generated drafts awaiting approval |
| `payments` | Payment records from Razorpay |
| `ai_predictions` | AI prediction history |
| `consent_log` | DPDP consent audit trail |
| `audit_log` | System audit log |

See `supabase/migrations/001_initial_schema.sql` for the full schema.

## AI Engine

### Message Draft Generation

The AI engine generates follow-up message drafts based on:

- **Escalation level** ΓÇö Determines tone progression:
  - `gentle` ΓÇö First nudge, assumes they forgot
  - `firm` ΓÇö Second follow-up, references previous message
  - `urgent` ΓÇö Third+ follow-up, clear deadline
- **User style preset** ΓÇö How you like to communicate:
  - `casual` ΓÇö Friendly, conversational, emoji-friendly
  - `professional` ΓÇö Clear, respectful, business-appropriate
  - `formal` ΓÇö Structured, reference-heavy, official tone
- **Response history** ΓÇö AI knows what happened last time:
  - Client replied promising payment ΓåÆ draft acknowledges and follows up
  - Client went silent ΓåÆ draft escalates appropriately
  - Client disputed amount ΓåÆ draft references resolution

```typescript
// Example draft output
{
  draft_id: "draft_abc123",
  client_name: "Rahul Sharma",
  invoice_amount: 25000,
  escalation_level: "gentle",
  style: "professional",
  message: "Hi Rahul, hope you're doing well. Just a quick reminder that invoice #INV-2026-042 (Γé╣25,000) was due on May 15. Please let me know if you need any details from my end. You can pay directly here: razorpay.me/xyz",
  generated_at: "2026-05-21T06:00:00Z",
  status: "pending"  // pending | approved | sent | dismissed
}
```

### v2: LLM-Powered Generation (Planned)

- Upgrade from template-based to LLM-generated messages
- Learns from approved drafts to improve future suggestions
- Contextual awareness of client industry and relationship history

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| AI Draft Generation | Daily 6 AM IST | Generate message drafts for all overdue invoices |
| Payment Reconciliation | Every 30 min | Catch missed webhooks |
| Consent Cleanup | Monthly 1st 3 AM | Delete old consent logs |

All cron jobs are paginated (100 records/batch) to avoid Vercel's 60s serverless timeout.

## Pricing

| Tier | Price | Invoices | Features |
|------|-------|----------|----------|
| **Free** | Γé╣0/month | 10 | Basic drafts, manual review |
| **Starter** | Γé╣999/month | 50 | AI drafts, escalation levels, style presets |
| **Growth** | Γé╣2,999/month | 500 | Response history, multilingual drafts, UPI links |
| **Business** | Γé╣7,999/month | Unlimited | Tally/Zoho sync, team access, custom flows |

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
npx jest src/lib/ai/__tests__/draft-generator.test.ts
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

MIT ΓÇö see [LICENSE](LICENSE) for details.

## Contact

- **Website:** [paychase.ai](https://paychase.ai) (coming soon)
- **Twitter:** [@paychaseai](https://twitter.com/paychaseai) (coming soon)
- **Email:** hello@paychase.ai
