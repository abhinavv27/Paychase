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
          onSave={async (data) => { await saveTemplate(data); router.push('/settings/templates') }}
          onCancel={() => router.push('/settings/templates')}
        />
      </div>
    </div>
  )
}
