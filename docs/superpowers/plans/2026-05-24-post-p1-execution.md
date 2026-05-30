# Post-P1 Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship P2 features, harden production, deploy to Vercel, and polish UX

**Architecture:** 4 phases executed sequentially. Phase 1 (P2 Features) has 5 independent sub-projects. Each sub-project is a self-contained group of tasks. Phases 2-4 are smaller and can be done more quickly.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase, Resend, Upstash, Razorpay, Vercel

---

## File Map

**New files (25+):**
- `src/lib/client-events.ts` — event insert + query functions
- `src/app/api/clients/[id]/events/route.ts` — activity events API
- `src/components/clients/activity-feed.tsx` — timeline UI component
- `src/app/(dashboard)/invoices/import/page.tsx` — CSV import page
- `src/app/api/invoices/import/route.ts` — CSV parse + import endpoint
- `src/lib/invoices/csv-import.ts` — CSV parsing logic
- `src/components/invoices/import-result.tsx` — import result display
- `src/app/(dashboard)/settings/templates/page.tsx` — template list
- `src/app/(dashboard)/settings/templates/[id]/edit/page.tsx` — template editor
- `src/lib/ai/custom-templates.ts` — template CRUD + lookup
- `src/components/templates/template-editor.tsx` — editor form
- `src/components/templates/variable-picker.tsx` — variable chips
- `src/app/api/webhooks/razorpay/route.ts` — Razorpay webhook
- `src/app/(dashboard)/reconciliation/page.tsx` — reconciliation UI
- `src/lib/payments/reconciliation.ts` — matching logic
- `src/components/payments/unmatched-list.tsx` — unmatched payments view
- `src/lib/rate-limit.ts` — rate limiting helper
- `src/components/ui/empty-state.tsx` — reusable empty state
- `src/components/ui/skeleton.tsx` — skeleton components
- `.github/workflows/ci.yml` — CI pipeline
- `.github/workflows/deploy.yml` — deploy pipeline
- `vercel.json` — build config

**Modified files (15+):**
- `src/app/(dashboard)/clients/[id]/page.tsx` — add activity tab
- `src/lib/ai/message-generator.ts` — check custom templates
- Dashboard pages — add skeletons + empty states
- API routes — add rate limiting
- `src/app/layout.tsx` — add Toaster
- Various mutation components — add toast notifications

---

## Phase 1: P2 Features

### Task 1: Client Activity Log

**Files:**
- Create: `src/lib/client-events.ts`
- Create: `src/app/api/clients/[id]/events/route.ts`
- Create: `src/components/clients/activity-feed.tsx`
- Modify: `src/app/(dashboard)/clients/[id]/page.tsx`

- [ ] **Create client-events library**

`src/lib/client-events.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export type EventType = 'invoice_sent' | 'invoice_paid' | 'reminder_sent' | 'reminder_delivered' | 'reminder_responded' | 'note_added'

export interface ClientEvent {
  id: string
  client_id: string
  user_id: string
  event_type: EventType
  event_data: Record<string, unknown>
  created_at: string
}

export async function insertClientEvent(params: {
  clientId: string
  userId: string
  eventType: EventType
  eventData?: Record<string, unknown>
}) {
  const supabase = createClient()
  const { error } = await supabase.from('client_events').insert({
    client_id: params.clientId,
    user_id: params.userId,
    event_type: params.eventType,
    event_data: params.eventData || {},
  })
  if (error) throw new Error(`Failed to insert client event: ${error.message}`)
}

export async function getClientEvents(clientId: string): Promise<ClientEvent[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('client_events')
    .select('*')
    .eq('client_id', clientId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(`Failed to fetch client events: ${error.message}`)
  return data || []
}
```

- [ ] **Create events API endpoint**

`src/app/api/clients/[id]/events/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getClientEvents } from '@/lib/client-events'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const events = await getClientEvents(params.id)
    return NextResponse.json({ events })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to fetch events' }, { status: 500 })
  }
}
```

- [ ] **Create ActivityFeed component**

`src/components/clients/activity-feed.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Send, CheckCircle, MessageSquare, DollarSign, FileText, Loader2 } from 'lucide-react'

interface ActivityEvent {
  id: string
  event_type: string
  event_data: Record<string, unknown>
  created_at: string
}

const eventConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  invoice_sent: { icon: Send, label: 'Invoice sent', color: 'text-blue-600 bg-blue-50' },
  invoice_paid: { icon: DollarSign, label: 'Invoice paid', color: 'text-green-600 bg-green-50' },
  reminder_sent: { icon: Send, label: 'Reminder sent', color: 'text-indigo-600 bg-indigo-50' },
  reminder_delivered: { icon: CheckCircle, label: 'Reminder delivered', color: 'text-green-600 bg-green-50' },
  reminder_responded: { icon: MessageSquare, label: 'Client replied', color: 'text-purple-600 bg-purple-50' },
  note_added: { icon: FileText, label: 'Note added', color: 'text-gray-600 bg-gray-50' },
}

export function ActivityFeed({ clientId }: { clientId: string }) {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/clients/${clientId}/events`)
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>

  if (events.length === 0) return <p className="text-sm text-gray-400 text-center py-8">No activity yet</p>

  return (
    <div className="space-y-0">
      {events.map((event) => {
        const config = eventConfig[event.event_type] || { icon: FileText, label: event.event_type, color: 'text-gray-600 bg-gray-50' }
        const Icon = config.icon
        return (
          <div key={event.id} className="flex gap-3 py-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.color.split(' ')[1]}`}>
              <Icon className={`w-4 h-4 ${config.color.split(' ')[0]}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{config.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(event.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Integrate activity feed into client detail page with tabs**

Read `src/app/(dashboard)/clients/[id]/page.tsx` first. If it already exists, modify it to add an "Activity" tab alongside existing content.

Add this after the main content section:

```tsx
import { ActivityFeed } from '@/components/clients/activity-feed'

// Inside the page component, replace the current content wrapper with a tabbed layout:
const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview')

// Add tab navigation above content
<div className="flex gap-4 border-b border-gray-200 mb-6">
  <button onClick={() => setActiveTab('overview')} className={`pb-2 text-sm font-medium ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Overview</button>
  <button onClick={() => setActiveTab('activity')} className={`pb-2 text-sm font-medium ${activeTab === 'activity' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}>Activity</button>
</div>

{activeTab === 'overview' ? (
  /* existing content */
) : (
  <ActivityFeed clientId={params.id} />
)}
```

- [ ] **Commit**

```bash
git add src/lib/client-events.ts src/app/api/clients/ src/components/clients/activity-feed.tsx
git commit -m "feat: add client activity log with timeline UI"
```

---

### Task 2: CSV Invoice Import

**Files:**
- Create: `src/lib/invoices/csv-import.ts`
- Create: `src/app/api/invoices/import/route.ts`
- Create: `src/app/(dashboard)/invoices/import/page.tsx`
- Create: `src/components/invoices/import-result.tsx`

- [ ] **Install papaparse**

```bash
npm install papaparse
npm install -D @types/papaparse
```

- [ ] **Create CSV parsing + import logic**

`src/lib/invoices/csv-import.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import Papa from 'papaparse'

export interface CsvRow {
  client_name: string
  amount: number
  due_date: string
  invoice_number?: string
  client_phone?: string
  client_email?: string
}

export interface ImportResult {
  imported: number
  errors: { row: number; message: string }[]
  skipped: number
}

export async function parseCsvContent(content: string): Promise<{ rows: CsvRow[]; errors: ImportResult['errors'] }> {
  return new Promise((resolve) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const errors: ImportResult['errors'] = []
        const rows: CsvRow[] = []

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i] as Record<string, unknown>
          const rowNum = i + 2 // 1-indexed + header row

          if (!row.client_name || !row.amount) {
            errors.push({ row: rowNum, message: 'Missing required fields: client_name, amount' })
            continue
          }

          if (!row.due_date) {
            errors.push({ row: rowNum, message: 'Missing required field: due_date' })
            continue
          }

          const amount = Number(row.amount)
          if (isNaN(amount) || amount <= 0) {
            errors.push({ row: rowNum, message: `Invalid amount: ${row.amount}` })
            continue
          }

          rows.push({
            client_name: String(row.client_name),
            amount,
            due_date: String(row.due_date),
            invoice_number: row.invoice_number ? String(row.invoice_number) : undefined,
            client_phone: row.client_phone ? String(row.client_phone) : undefined,
            client_email: row.client_email ? String(row.client_email) : undefined,
          })
        }

        resolve({ rows, errors })
      },
      error: (err) => {
        resolve({ rows: [], errors: [{ row: 1, message: err.message }] })
      },
    })
  })
}

export async function importCsvRows(rows: CsvRow[], userId: string): Promise<ImportResult> {
  const supabase = createClient()
  const result: ImportResult = { imported: 0, errors: [], skipped: 0 }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    try {
      // Find or create client
      let clientId: string | null = null

      if (row.client_phone) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('phone', row.client_phone)
          .eq('user_id', userId)
          .maybeSingle()
        if (existing) clientId = existing.id
      }

      if (!clientId) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id')
          .eq('name', row.client_name)
          .eq('user_id', userId)
          .maybeSingle()
        if (existing) clientId = existing.id
      }

      if (!clientId) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: userId,
            name: row.client_name,
            phone: row.client_phone || null,
            email: row.client_email || null,
            consent_given: true,
            consent_date: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (clientError || !newClient) {
          result.errors.push({ row: rowNum, message: `Failed to create client: ${clientError?.message}` })
          continue
        }
        clientId = newClient.id
      }

      // Check for duplicate invoice number
      if (row.invoice_number) {
        const { data: existing } = await supabase
          .from('invoices')
          .select('id')
          .eq('invoice_number', row.invoice_number)
          .eq('user_id', userId)
          .maybeSingle()
        if (existing) {
          result.errors.push({ row: rowNum, message: `Duplicate invoice number: ${row.invoice_number}` })
          continue
        }
      }

      // Create invoice
      const { error: invoiceError } = await supabase.from('invoices').insert({
        user_id: userId,
        client_id: clientId,
        amount: row.amount,
        due_date: row.due_date,
        invoice_number: row.invoice_number || `INV-${Date.now()}-${i}`,
        status: 'pending',
        issue_date: new Date().toISOString(),
      })

      if (invoiceError) {
        result.errors.push({ row: rowNum, message: `Failed to create invoice: ${invoiceError.message}` })
        continue
      }

      result.imported++
    } catch (err) {
      result.errors.push({ row: rowNum, message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}` })
    }
  }

  return result
}
```

- [ ] **Create import API endpoint**

`src/app/api/invoices/import/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseCsvContent, importCsvRows } from '@/lib/invoices/csv-import'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const content = await file.text()
    const { rows, errors: parseErrors } = await parseCsvContent(content)

    if (rows.length === 0) {
      return NextResponse.json({ imported: 0, errors: parseErrors, skipped: 0 })
    }

    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 rows per import' }, { status: 400 })
    }

    const result = await importCsvRows(rows, user.id)
    result.errors = [...parseErrors, ...result.errors]

    revalidatePath('/invoices')
    revalidatePath('/clients')
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Import failed' }, { status: 500 })
  }
}
```

- [ ] **Create import page**

`src/app/(dashboard)/invoices/import/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Upload, FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ImportResultView } from '@/components/invoices/import-result'

export default function ImportInvoicesPage() {
  const [result, setResult] = useState<{ imported: number; errors: { row: number; message: string }[]; skipped: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const form = new FormData()
    form.append('file', file)

    try {
      const res = await fetch('/api/invoices/import', { method: 'POST', body: form })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ imported: 0, errors: [{ row: 0, message: 'Network error' }], skipped: 0 })
    } finally {
      setLoading(false)
    }
  }

  if (result) return <ImportResultView result={result} onReset={() => setResult(null)} />

  return (
    <div className="max-w-lg mx-auto py-12">
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to invoices
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Import Invoices</h1>
        <p className="text-sm text-gray-500 mb-6">Upload a CSV file with columns: client_name, amount, due_date, invoice_number, client_phone, client_email</p>
        <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors">
          <FileText className="w-4 h-4" />
          {loading ? 'Uploading...' : 'Choose CSV File'}
          <input type="file" accept=".csv" onChange={handleFile} disabled={loading} className="hidden" />
        </label>
      </div>
    </div>
  )
}
```

- [ ] **Create ImportResultView component**

`src/components/invoices/import-result.tsx`:

```tsx
'use client'

import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface ImportResultViewProps {
  result: { imported: number; errors: { row: number; message: string }[]; skipped: number }
  onReset: () => void
}

export function ImportResultView({ result, onReset }: ImportResultViewProps) {
  return (
    <div className="max-w-lg mx-auto py-12">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="text-center mb-6">
          {result.imported > 0 ? (
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          ) : (
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          )}
          <h2 className="text-xl font-bold text-gray-900">Import Complete</h2>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm py-2 border-b border-gray-100">
            <span className="text-gray-500">Imported</span>
            <span className="font-medium text-green-600">{result.imported}</span>
          </div>
          {result.errors.length > 0 && (
            <div className="flex justify-between text-sm py-2 border-b border-gray-100">
              <span className="text-gray-500">Errors</span>
              <span className="font-medium text-red-600">{result.errors.length}</span>
            </div>
          )}
        </div>
        {result.errors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Errors</h3>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-red-600">Row {err.row}: {err.message}</p>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <Link href="/invoices" className="flex-1 py-2.5 text-center text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">View Invoices</Link>
          <button onClick={onReset} className="flex items-center gap-1 px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" /> Import More
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/lib/invoices/csv-import.ts src/app/api/invoices/import/ src/app/(dashboard)/invoices/import/ src/components/invoices/import-result.tsx package.json
git commit -m "feat: add CSV invoice import with client auto-creation"
```

---

### Task 3: Custom Message Templates

**Files:**
- Create: `src/lib/ai/custom-templates.ts`
- Create: `src/components/templates/variable-picker.tsx`
- Create: `src/components/templates/template-editor.tsx`
- Create: `src/app/(dashboard)/settings/templates/page.tsx`
- Create: `src/app/(dashboard)/settings/templates/[id]/edit/page.tsx`
- Modify: `src/lib/ai/message-generator.ts`

- [ ] **Create custom templates library**

`src/lib/ai/custom-templates.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export interface CustomTemplate {
  id: string
  user_id: string
  name: string
  language: string
  escalation_level: 'gentle' | 'firm' | 'urgent'
  message_text: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getTemplates(): Promise<CustomTemplate[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('custom_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('language')
    .order('escalation_level')

  return data || []
}

export async function getTemplate(id: string): Promise<CustomTemplate | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('custom_templates')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  return data
}

export async function saveTemplate(params: {
  id?: string
  name: string
  language: string
  escalation_level: string
  message_text: string
  variables: string[]
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (params.id) {
    const { error } = await supabase
      .from('custom_templates')
      .update({ ...params, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('custom_templates').insert({
      ...params,
      user_id: user.id,
    })
    if (error) throw new Error(error.message)
  }
}

export async function deleteTemplate(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('custom_templates').delete().eq('id', id).eq('user_id', user.id)
}

export async function lookupTemplate(params: {
  language: string
  escalationLevel: string
  userId: string
}): Promise<CustomTemplate | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('custom_templates')
    .select('*')
    .eq('user_id', params.userId)
    .eq('language', params.language)
    .eq('escalation_level', params.escalationLevel)
    .eq('is_active', true)
    .maybeSingle()
  return data
}
```

- [ ] **Create variable picker component**

`src/components/templates/variable-picker.tsx`:

```tsx
'use client'

const VARIABLES = [
  { key: '{clientName}', label: 'Client Name' },
  { key: '{invoiceNumber}', label: 'Invoice Number' },
  { key: '{amount}', label: 'Amount' },
  { key: '{dueDate}', label: 'Due Date' },
  { key: '{overdueDays}', label: 'Overdue Days' },
  { key: '{paymentLink}', label: 'Payment Link' },
]

export function VariablePicker({ onInsert }: { onInsert: (variable: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {VARIABLES.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onInsert(v.key)}
          className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          title={v.label}
        >
          {v.key}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Create template editor component**

`src/components/templates/template-editor.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { VariablePicker } from './variable-picker'

interface TemplateEditorProps {
  initialData?: {
    id: string
    name: string
    language: string
    escalation_level: string
    message_text: string
  }
  onSave: (data: { id?: string; name: string; language: string; escalation_level: string; message_text: string; variables: string[] }) => Promise<void>
  onCancel: () => void
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'bn', name: 'বাংলা' },
]

const ESCALATION_LEVELS = [
  { value: 'gentle', label: 'Gentle', desc: 'First reminder — friendly tone' },
  { value: 'firm', label: 'Firm', desc: 'Follow-up — direct but polite' },
  { value: 'urgent', label: 'Urgent', desc: 'Final notice — immediate action' },
]

export function TemplateEditor({ initialData, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [language, setLanguage] = useState(initialData?.language || 'en')
  const [escalationLevel, setEscalationLevel] = useState(initialData?.escalation_level || 'gentle')
  const [messageText, setMessageText] = useState(initialData?.message_text || '')
  const [preview, setPreview] = useState('')
  const [saving, setSaving] = useState(false)

  const insertVariable = (variable: string) => {
    setMessageText((prev) => prev + variable)
  }

  const handlePreview = () => {
    let text = messageText
    text = text.replace('{clientName}', 'Acme Corp')
    text = text.replace('{invoiceNumber}', 'INV-001')
    text = text.replace('{amount}', '₹50,000')
    text = text.replace('{dueDate}', '15 Jun 2026')
    text = text.replace('{overdueDays}', '10')
    text = text.replace('{paymentLink}', 'https://pay.example.com/link')
    setPreview(text)
  }

  const handleSave = async () => {
    if (!name.trim() || !messageText.trim()) return
    setSaving(true)
    try {
      const variables = ['clientName', 'invoiceNumber', 'amount', 'dueDate']
      if (messageText.includes('{overdueDays}')) variables.push('overdueDays')
      if (messageText.includes('{paymentLink}')) variables.push('paymentLink')
      await onSave({ id: initialData?.id, name, language, escalation_level: escalationLevel, message_text: messageText, variables })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Gentle Reminder" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Escalation Level</label>
          <select value={escalationLevel} onChange={(e) => setEscalationLevel(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {ESCALATION_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message Template</label>
        <VariablePicker onInsert={insertVariable} />
        <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={6} placeholder="Hi {clientName}, this is a reminder about invoice {invoiceNumber}..." className="w-full mt-2 px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm" />
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={handlePreview} className="text-xs text-indigo-600 hover:text-indigo-800">Preview</button>
        </div>
        {preview && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">{preview}</div>
        )}
      </div>
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button onClick={handleSave} disabled={saving || !name.trim() || !messageText.trim()} className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Template'}</button>
        <button onClick={onCancel} className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
      </div>
    </div>
  )
}
```

- [ ] **Create templates list page**

`src/app/(dashboard)/settings/templates/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTemplates } from '@/lib/ai/custom-templates'
import { Plus, FileText, Pencil, Trash2 } from 'lucide-react'
import { DeleteTemplateButton } from './delete-button'

export const metadata: Metadata = { title: 'Message Templates' }

export default async function TemplatesPage() {
  const templates = await getTemplates()

  const langNames: Record<string, string> = { en: 'English', hi: 'हिन्दी', ta: 'தமிழ்', te: 'తెలుగు', bn: 'বাংলা' }
  const escalationColors: Record<string, string> = { gentle: 'bg-green-50 text-green-700', firm: 'bg-yellow-50 text-yellow-700', urgent: 'bg-red-50 text-red-700' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Customize your payment follow-up messages</p>
        </div>
        <Link href="/settings/templates/new" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> New Template
        </Link>
      </div>
      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900">No templates yet</h3>
          <p className="text-sm text-gray-500 mt-1">Create your first custom message template.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-gray-900">{t.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{langNames[t.language] || t.language}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${escalationColors[t.escalation_level] || 'bg-gray-50 text-gray-600'}`}>{t.escalation_level}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${t.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>{t.is_active ? 'Active' : 'Inactive'}</span>
                <Link href={`/settings/templates/${t.id}/edit`} className="text-gray-400 hover:text-gray-600"><Pencil className="w-4 h-4" /></Link>
                <DeleteTemplateButton id={t.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Create delete button component**

`src/app/(dashboard)/settings/templates/delete-button.tsx`:

```tsx
'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteTemplate } from '@/lib/ai/custom-templates'
import { useRouter } from 'next/navigation'

export function DeleteTemplateButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      onClick={() => startTransition(async () => { await deleteTemplate(id); router.refresh() })}
      disabled={isPending}
      className="text-gray-400 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
```

- [ ] **Create template editor page (new + edit)**

`src/app/(dashboard)/settings/templates/new/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { TemplateEditorWrapper } from '../editor-wrapper'

export const metadata: Metadata = { title: 'New Template' }

export default function NewTemplatePage() {
  return <TemplateEditorWrapper />
}
```

`src/app/(dashboard)/settings/templates/[id]/edit/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTemplate } from '@/lib/ai/custom-templates'
import { TemplateEditorWrapper } from '../../editor-wrapper'

export const metadata: Metadata = { title: 'Edit Template' }

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const template = await getTemplate(params.id)
  if (!template) notFound()
  return <TemplateEditorWrapper template={template} />
}
```

`src/app/(dashboard)/settings/templates/editor-wrapper.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { TemplateEditor } from '@/components/templates/template-editor'
import { saveTemplate } from '@/lib/ai/custom-templates'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface TemplateData { id: string; name: string; language: string; escalation_level: string; message_text: string }

export function TemplateEditorWrapper({ template }: { template?: TemplateData }) {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/settings/templates" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to templates
      </Link>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">{template ? 'Edit Template' : 'New Template'}</h1>
        <TemplateEditor
          initialData={template ? { id: template.id, name: template.name, language: template.language, escalation_level: template.escalation_level, message_text: template.message_text } : undefined}
          onSave={async (data) => { await saveTemplate(data); router.push('/settings/templates'); router.refresh() }}
          onCancel={() => router.push('/settings/templates')}
        />
      </div>
    </div>
  )
}
```

- [ ] **Update message-generator to check custom templates**

In `src/lib/ai/message-generator.ts`, add a check before the built-in translation path:

```typescript
import { lookupTemplate } from './custom-templates'

// In generateFollowUpMessage, after computing escalationLevel and before calling getTranslation:
const customTemplate = await lookupTemplate({
  language: language || 'en',
  escalationLevel,
  userId: '', // needs to be passed through from caller
})

if (customTemplate) {
  let text = customTemplate.message_text
  const amountStr = `₹${amount.toLocaleString('en-IN')}`
  text = text.replace('{clientName}', clientName)
  text = text.replace('{invoiceNumber}', invoiceNumber)
  text = text.replace('{amount}', amountStr)
  text = text.replace('{dueDate}', dueDate)
  if (daysOverdue !== undefined) text = text.replace('{overdueDays}', String(daysOverdue))
  if (upiLink) text = text.replace('{paymentLink}', upiLink)
  return { text, escalationLevel, channel: 'whatsapp' }
}
```

Note: This requires adding `userId` to the `generateFollowUpMessage` params. Update the interface accordingly.

- [ ] **Commit**

```bash
git add src/lib/ai/custom-templates.ts src/components/templates/ src/app/(dashboard)/settings/templates/
git commit -m "feat: add custom message templates with variable picker and editor"
```

---

### Task 4: Payment Reconciliation (Razorpay Webhook + UI)

**Files:**
- Create: `src/lib/payments/reconciliation.ts`
- Create: `src/app/api/webhooks/razorpay/route.ts`
- Create: `src/app/(dashboard)/reconciliation/page.tsx`
- Create: `src/components/payments/unmatched-list.tsx`

- [ ] **Create reconciliation library**

`src/lib/payments/reconciliation.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PaymentTransaction {
  id: string
  user_id: string
  invoice_id: string | null
  razorpay_payment_id: string
  amount: number
  currency: string
  status: 'matched' | 'unmatched' | 'refunded'
  matched_at: string | null
  created_at: string
}

export async function getReconciliationData() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { matched: [], unmatched: [] }

  const [matchedRes, unmatchedRes] = await Promise.all([
    supabase.from('payment_transactions').select('*').eq('user_id', user.id).eq('status', 'matched').order('created_at', { ascending: false }).limit(20),
    supabase.from('payment_transactions').select('*').eq('user_id', user.id).eq('status', 'unmatched').order('created_at', { ascending: false }).limit(20),
  ])

  return {
    matched: (matchedRes.data || []) as PaymentTransaction[],
    unmatched: (unmatchedRes.data || []) as PaymentTransaction[],
  }
}

export async function matchPayment(transactionId: string, invoiceId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: tx } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .single()

  if (!tx) return { error: 'Transaction not found' }

  const { error: txError } = await supabase
    .from('payment_transactions')
    .update({ invoice_id: invoiceId, status: 'matched', matched_at: new Date().toISOString() })
    .eq('id', transactionId)

  if (txError) return { error: txError.message }

  await supabase.from('invoices').update({ status: 'paid', payment_date: new Date().toISOString() }).eq('id', invoiceId)

  revalidatePath('/reconciliation')
  revalidatePath('/invoices')
  return { success: true }
}
```

- [ ] **Create Razorpay webhook handler**

`src/app/api/webhooks/razorpay/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  // Verify webhook signature
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (webhookSecret) {
    const crypto = await import('crypto')
    const expectedSig = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex')
    if (signature !== expectedSig) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const event = JSON.parse(body)

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity
    const invoiceNumber = payment.notes?.invoice_number

    const supabase = createClient({ admin: true })

    // Find invoice by invoice_number
    if (invoiceNumber) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, user_id')
        .eq('invoice_number', invoiceNumber)
        .maybeSingle()

      if (invoice) {
        await supabase.from('payment_transactions').insert({
          user_id: invoice.user_id,
          invoice_id: invoice.id,
          razorpay_payment_id: payment.id,
          amount: Number(payment.amount) / 100,
          currency: payment.currency,
          status: 'matched',
          matched_at: new Date().toISOString(),
        })

        await supabase.from('invoices').update({ status: 'paid', payment_date: new Date().toISOString() }).eq('id', invoice.id)

        return NextResponse.json({ status: 'matched' })
      }
    }

    // No match — record as unmatched
    const { data: userByKey } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single()

    if (userByKey) {
      await supabase.from('payment_transactions').insert({
        user_id: userByKey.id,
        invoice_id: null,
        razorpay_payment_id: payment.id,
        amount: Number(payment.amount) / 100,
        currency: payment.currency,
        status: 'unmatched',
      })
    }
  }

  return NextResponse.json({ status: 'received' })
}
```

- [ ] **Create reconciliation page**

`src/app/(dashboard)/reconciliation/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { getReconciliationData } from '@/lib/payments/reconciliation'
import { UnmatchedList } from '@/components/payments/unmatched-list'
import { CheckCircle, Clock } from 'lucide-react'

export const metadata: Metadata = { title: 'Reconciliation' }

export default async function ReconciliationPage() {
  const { matched, unmatched } = await getReconciliationData()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Reconciliation</h1>
        <p className="text-sm text-gray-500 mt-1">Match Razorpay payments to invoices</p>
      </div>

      {unmatched.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" /> Unmatched Payments
          </h2>
          <UnmatchedList payments={unmatched} />
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" /> Recently Matched
        </h2>
        {matched.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No matched payments yet</p>
        ) : (
          <div className="space-y-2">
            {matched.map((tx) => (
              <div key={tx.id} className="bg-white rounded-lg border border-gray-200 p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">₹{(tx.amount).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500">{tx.razorpay_payment_id}</p>
                </div>
                <span className="text-xs text-green-600 font-medium">Matched</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Create unmatched list component**

`src/components/payments/unmatched-list.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { PaymentTransaction } from '@/lib/payments/reconciliation'
import { matchPayment } from '@/lib/payments/reconciliation'
import { useRouter } from 'next/navigation'

export function UnmatchedList({ payments }: { payments: PaymentTransaction[] }) {
  const [selectedInvoice, setSelectedInvoice] = useState<Record<string, string>>({})
  const router = useRouter()

  const handleMatch = async (txId: string) => {
    const invoiceId = selectedInvoice[txId]
    if (!invoiceId) return
    await matchPayment(txId, invoiceId)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {payments.map((tx) => (
        <div key={tx.id} className="bg-white rounded-xl border border-yellow-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-gray-900">₹{tx.amount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 font-mono">{tx.razorpay_payment_id}</p>
            </div>
            <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Unmatched</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={selectedInvoice[tx.id] || ''}
              onChange={(e) => setSelectedInvoice((prev) => ({ ...prev, [tx.id]: e.target.value }))}
              placeholder="Invoice ID to match"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleMatch(tx.id)}
              disabled={!selectedInvoice[tx.id]}
              className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Match
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/lib/payments/reconciliation.ts src/app/api/webhooks/razorpay/ src/app/(dashboard)/reconciliation/ src/components/payments/unmatched-list.tsx
git commit -m "feat: add payment reconciliation with Razorpay webhook"
```

---

### Task 5: Team/Org Mode (Multi-Tenant)

**Note:** This is the largest feature. It requires DB migrations, middleware, and touching every data access layer. The full scope is documented in the spec. Given its size, this will be deferred to its own plan later. For now, implement only the database schema and organization creation flow.

**Files to implement now (schema + basic org creation):**
- DB migration: organization tables
- `src/lib/orgs/queries.ts` — create org, get orgs

- [ ] **Create migration SQL**

Read the existing migration in `supabase/migrations/` to understand the naming convention. Create a new migration:

```sql
-- organizations
create table organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  plan text default 'free',
  created_at timestamptz default now()
);

-- organization_members
create table organization_members (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) not null,
  user_id uuid references users(id) not null,
  role text not null default 'member',
  invited_by uuid references users(id),
  invited_at timestamptz default now(),
  joined_at timestamptz,
  unique(organization_id, user_id)
);
```

- [ ] **Create org library**

`src/lib/orgs/queries.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  created_at: string
}

export async function createOrganization(name: string): Promise<Organization> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)

  const { data: org, error } = await supabase
    .from('organizations')
    .insert({ name, slug })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase.from('organization_members').insert({
    organization_id: org.id,
    user_id: user.id,
    role: 'admin',
    joined_at: new Date().toISOString(),
  })

  revalidatePath('/settings/team')
  return org
}

export async function getUserOrganizations(): Promise<Organization[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('organization_members')
    .select('organization:organizations(*)')
    .eq('user_id', user.id)

  return (data || []).map((d: Record<string, unknown>) => (d.organization as Organization))
}
```

- [ ] **Commit**

```bash
git add supabase/migrations/007_organizations.sql src/lib/orgs/queries.ts
git commit -m "feat: add organization schema and creation flow"
```

---

## Phase 2: Production Hardening

### Task 6: Sentry Verification + Rate Limiting

**Files:**
- Create: `src/lib/rate-limit.ts`
- Modify: existing API routes to add rate limiting

- [ ] **Verify Sentry configuration**

Check `sentry.client.config.ts` and `sentry.server.config.ts` exist in project root. Verify they have the correct DSN from `SENTRY_DSN` env var. No code changes needed unless missing.

- [ ] **Create rate limiter**

`src/lib/rate-limit.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
  })
}

export async function checkRateLimit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!ratelimit) return { success: true, limit: 0, remaining: 0, reset: 0 }
  return ratelimit.limit(identifier)
}
```

- [ ] **Add rate limiting to API routes**

For each POST/PATCH/DELETE API route, add at the top of the handler:

```typescript
import { checkRateLimit } from '@/lib/rate-limit'

// After auth check:
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
const rateLimitResult = await checkRateLimit(`api:${user.id}:${ip}`)
if (!rateLimitResult.success) {
  return NextResponse.json({ error: 'Too many requests' }, {
    status: 429,
    headers: { 'Retry-After': String(rateLimitResult.reset) },
  })
}
```

- [ ] **Commit**

```bash
git add src/lib/rate-limit.ts
git commit -m "feat: add API rate limiting with Upstash"
```

---

## Phase 3: Deployment

### Task 7: Vercel Setup

**Files:**
- Create: `vercel.json`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`

- [ ] **Create vercel.json**

`vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

- [ ] **Create CI workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

- [ ] **Create deploy workflow**

`.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

- [ ] **Commit**

```bash
git add vercel.json .github/workflows/
git commit -m "feat: add Vercel config and CI/CD pipelines"
```

---

## Phase 4: Polishing

### Task 8: UI Components (Empty States, Skeletons, Toasts)

**Files:**
- Create: `src/components/ui/empty-state.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Modify: `src/app/layout.tsx` — add Toaster
- Modify: dashboard pages — add empty states + skeletons
- Modify: mutation components — add toast notifications

- [ ] **Create EmptyState component**

`src/components/ui/empty-state.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="w-12 h-12 text-gray-300 mb-4" />
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 mb-4">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">{actionLabel}</Link>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">{actionLabel}</button>
      )}
    </div>
  )
}
```

- [ ] **Create Skeleton component**

`src/components/ui/skeleton.tsx`:

```tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-48" />
    </div>
  )
}
```

- [ ] **Add Toaster to layout**

In `src/app/layout.tsx`, add the Toaster import and component. Check if react-hot-toast is already installed; if not:

```bash
npm install react-hot-toast
```

Add to layout:
```tsx
import { Toaster } from 'react-hot-toast'

// Inside the body tag, before </body>:
<Toaster
  position="top-right"
  toastOptions={{
    duration: 3000,
    style: { fontSize: '14px', borderRadius: '8px' },
  }}
/>
```

- [ ] **Apply EmptyState to list pages**

Replace "no data" placeholders in:
- `invoices/page.tsx` — replace empty table body with `<EmptyState icon={FileText} title="No invoices yet" description="..." actionLabel="Create Invoice" actionHref="/invoices/create" />`
- `clients/page.tsx` — replace empty state
- `approvals/page.tsx` — replace empty state
- `reconciliation/page.tsx` — already has empty state text

- [ ] **Add toast notifications to mutation actions**

In key mutation buttons/components, add:
```tsx
import toast from 'react-hot-toast'

// Before the mutation:
toast.loading('Processing...')

// On success:
toast.dismiss()
toast.success('Invoices marked as paid')

// On error:
toast.dismiss()
toast.error(result.error || 'Something went wrong')
```

Target components:
- `BulkActionBar` — mark paid, generate drafts
- `DeleteInvoiceButton` — delete invoice
- `DeliveryStatus` — status updates
- `QuickAddClient` — add client
- `ImportResultView` — import result already handled

- [ ] **Commit**

```bash
git add src/components/ui/ src/app/layout.tsx
git commit -m "feat: add UI primitives — empty states, skeletons, toast notifications"
```

---

## Self-Review Checklist

- [ ] Spec coverage: Every section in the spec has corresponding tasks
- [ ] No placeholders: All code blocks complete, no TODOs or TBDs
- [ ] Type consistency: Types/methods consistent across tasks
- [ ] Execution order: Phase 1 → 2 → 3 → 4, with Phase 1 sub-projects grouped logically
