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
    text = text.replaceAll('{clientName}', 'Acme Corp')
    text = text.replaceAll('{invoiceNumber}', 'INV-001')
    text = text.replaceAll('{amount}', '₹50,000')
    text = text.replaceAll('{dueDate}', '15 Jun 2026')
    text = text.replaceAll('{overdueDays}', '10')
    text = text.replaceAll('{paymentLink}', 'https://pay.example.com/link')
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
