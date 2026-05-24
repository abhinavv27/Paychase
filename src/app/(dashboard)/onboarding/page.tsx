'use client'

import { useState } from 'react'
import { useFormState } from 'react-dom'
import { completeOnboarding, skipOnboarding } from '@/lib/onboarding/actions'
import { ArrowRight, ArrowLeft, Building2, MessageSquare, Rocket } from 'lucide-react'

const styles = [
  { value: 'casual', label: 'Casual', desc: 'Friendly and relaxed tone' },
  { value: 'professional', label: 'Professional', desc: 'Polished and business-like' },
  { value: 'formal', label: 'Formal', desc: 'Strict and official tone' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [company, setCompany] = useState('')
  const [style, setStyle] = useState('professional')
  const [state, formAction] = useFormState(
    completeOnboarding as (state: { error?: string }, payload: FormData) => Promise<{ error?: string }>,
    {}
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-lg">
        {/* Progress stepper */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                  s <= step ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              />
              {s < 3 && (
                <div
                  className={`w-16 h-0.5 mx-2 transition-colors duration-300 ${
                    s < step ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Step 1: Company name */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome to PayChase AI</h2>
                <p className="mt-2 text-gray-600">
                  Let&apos;s get your account set up. Tell us about your business.
                </p>
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                />
              </div>
            </div>
          )}

          {/* Step 2: Communication style */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Communication style</h2>
                <p className="mt-2 text-gray-600">
                  How should we talk to your clients?
                </p>
              </div>
              <div className="space-y-3">
                {styles.map((s) => (
                  <label
                    key={s.value}
                    className={`block p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      style === s.value
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="style"
                      value={s.value}
                      checked={style === s.value}
                      onChange={(e) => setStyle(e.target.value)}
                      className="sr-only"
                    />
                    <div className="font-medium text-gray-900">{s.label}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{s.desc}</div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Summary */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">You&apos;re all set</h2>
                <p className="mt-2 text-gray-600">
                  Review your preferences before we start.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Company</span>
                  <span className="text-sm font-medium text-gray-900">
                    {company || <span className="italic text-gray-400">Not set</span>}
                  </span>
                </div>
                <div className="border-t border-gray-200" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Style</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{style}</span>
                </div>
              </div>

              <form action={formAction}>
                <input type="hidden" name="company" value={company} />
                <input type="hidden" name="style" value={style} />
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Start Dashboard
                </button>
              </form>

              <form action={skipOnboarding} className="text-center">
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                >
                  Skip, I&apos;ll set this up later
                </button>
              </form>

              {state?.error && (
                <p className="text-sm text-red-600 text-center">{state.error}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div className="mt-8 flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
