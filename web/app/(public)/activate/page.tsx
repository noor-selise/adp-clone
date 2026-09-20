import { Suspense } from 'react'
import { ActivateForm } from '@/components/auth/activate-form'

export default function ActivatePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-sm">
        <Suspense fallback={<p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}>
          <ActivateForm />
        </Suspense>
      </div>
    </div>
  )
}
