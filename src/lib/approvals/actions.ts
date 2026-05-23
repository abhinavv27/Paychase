'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateWhatsAppLink } from '@/lib/whatsapp/deep-link'

export async function approveDraft(draftId: string): Promise<{ success?: boolean; error?: string; deepLink?: string } | undefined> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: draft, error: fetchError } = await supabase
      .from('reminders')
      .select('message_text, client:clients(phone)')
      .eq('id', draftId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !draft) return { error: 'Draft not found' }
    if (!draft.message_text) return { error: 'Draft has no message to send' }

    const typedDraft = draft as unknown as { message_text: string; client: { phone: string } | null }
    const clientPhone = typedDraft.client?.phone

    const deepLink = generateWhatsAppLink({
      phone: clientPhone || '',
      message: draft.message_text,
    })

    const { error: updateError } = await supabase
      .from('reminders')
      .update({ approval_status: 'approved' })
      .eq('id', draftId)
      .eq('user_id', user.id)

    if (updateError) return { error: updateError.message }

    revalidatePath('/approvals')
    return { success: true, deepLink }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to approve draft' }
  }
}

export async function dismissDraft(draftId: string): Promise<{ success?: boolean; error?: string } | undefined> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('reminders')
      .update({ approval_status: 'rejected' })
      .eq('id', draftId)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/approvals')
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to dismiss draft' }
  }
}
