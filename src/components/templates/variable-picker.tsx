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
