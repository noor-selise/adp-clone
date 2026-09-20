'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { LanguageMenuCorner } from '@/components/language/language-menu-corner'
import { useLocale } from '@/components/providers/localization-provider'
import { Container } from '@/components/layout/container'
import { BrandLockup } from '@/components/brand/brand-lockup'

export default function LoginPage() {
  const { t } = useLocale()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-subtle)]">
      <LanguageMenuCorner />
      <Container
        variant="form"
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-sm"
      >
        <div className="mb-6">
          <BrandLockup href="/" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold">{t('login.title', 'Welcome back', 'auth')}</h1>
        <p className="mb-8 text-sm text-[var(--color-text-muted)]">
          {t('login.subtitle', 'Sign in with your MentorMatch account via Blocks OIDC.', 'auth')}
        </p>
        <Suspense fallback={<p className="text-sm text-[var(--color-text-muted)]">{t('loading', 'Loading…', 'common')}</p>}>
          <LoginForm />
        </Suspense>
        <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
          {t('login.newHere', 'New here?', 'auth')}{' '}
          <Link href="/register?as=mentee" className="font-medium text-[var(--color-brand)] hover:underline">
            {t('login.createAccount', 'Create an account', 'auth')}
          </Link>
        </p>
      </Container>
    </div>
  )
}
