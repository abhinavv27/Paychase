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
