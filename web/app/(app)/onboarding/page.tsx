'use client'

import { Suspense } from 'react'
import { RequireAuth } from '@/components/layout/app-shell'
import { OnboardingContent } from '@/components/onboarding/onboarding-content'

export default function OnboardingPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<p className="text-sm text-[var(--color-text-muted)]">Loading…</p>}>
        <OnboardingContent />
      </Suspense>
    </RequireAuth>
  )
}
