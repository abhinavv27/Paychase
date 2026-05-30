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
