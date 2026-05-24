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
