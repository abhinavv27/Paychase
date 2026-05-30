import type { Metadata } from 'next'
import { TemplateEditorWrapper } from '../editor-wrapper'

export const metadata: Metadata = { title: 'New Template' }

export default function NewTemplatePage() {
  return <TemplateEditorWrapper />
}
