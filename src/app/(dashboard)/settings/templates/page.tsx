import type { Metadata } from 'next'
import Link from 'next/link'
import { getTemplates } from '@/lib/ai/custom-templates'
import { Plus, FileText, Pencil } from 'lucide-react'
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
