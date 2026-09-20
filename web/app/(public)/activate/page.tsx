'use client'

import { Suspense } from 'react'
import { ActivateForm } from '@/components/auth/activate-form'
import { LanguageMenuCorner } from '@/components/language/language-menu-corner'
import { useLocale } from '@/components/providers/localization-provider'
import { Container } from '@/components/layout/container'
import { BrandLockup } from '@/components/brand/brand-lockup'

export default function ActivatePage() {
  const { t } = useLocale()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)] py-12">
      <LanguageMenuCorner />
      <Container
        variant="form"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-sm"
      >
        <div className="mb-6">
          <BrandLockup href="/" />
        </div>
        <Suspense fallback={<p className="text-sm text-[var(--color-text-muted)]">{t('loading', 'Loading…', 'common')}</p>}>
          <ActivateForm />
        </Suspense>
      </Container>
    </div>
  )
}
