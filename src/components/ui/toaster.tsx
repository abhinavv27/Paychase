'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: { fontSize: '14px', borderRadius: '8px', background: '#1F2937', color: '#F9FAFB' },
        success: { iconTheme: { primary: '#10B981', secondary: '#F9FAFB' } },
        error: { iconTheme: { primary: '#EF4444', secondary: '#F9FAFB' } },
      }}
    />
  )
}
