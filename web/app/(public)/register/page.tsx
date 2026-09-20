'use client'

import { Suspense } from 'react'
import { RegisterForm } from '@/components/auth/register-form'
import { RegisterAuthRedirect } from '@/components/auth/register-auth-redirect'
import { LanguageMenuCorner } from '@/components/language/language-menu-corner'
import { useLocale } from '@/components/providers/localization-provider'
import { Container } from '@/components/layout/container'
import { BrandLockup } from '@/components/brand/brand-lockup'

export default function RegisterPage() {
  const { t } = useLocale()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)] py-12">
      <LanguageMenuCorner />
      <RegisterAuthRedirect />
      <Container
        variant="form"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-sm"
      >
        <div className="mb-6">
          <BrandLockup href="/" />
        </div>
        <Suspense fallback={<p className="text-sm text-[var(--color-text-muted)]">{t('loading', 'Loading…', 'common')}</p>}>
          <RegisterForm />
        </Suspense>
      </Container>
    </div>
  )
}
