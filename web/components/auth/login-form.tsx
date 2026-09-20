'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { useLocale } from '@/components/providers/localization-provider'
import { isLoginConfigured } from '@/lib/blocks/config'
import { FlashBanner } from '@/components/ui/flash-banner'

export const LoginForm = () => {
  const { login } = useAuth()
  const { t } = useLocale()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const configured = isLoginConfigured()
  const returnTo = searchParams.get('returnTo') ?? '/dashboard'

  const handleLogin = async () => {
    setError(undefined)
    setPending(true)
    try {
      await login(returnTo)
    } catch (caught) {
      setError((caught as Error).message)
      setPending(false)
    }
  }

  if (!configured) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {t('login.notConfigured.before', 'Login is not configured. Register', 'auth')}{' '}
        <code className="rounded bg-[var(--color-bg-inset)] px-1">{typeof window !== 'undefined' ? `${window.location.origin}/login/callback` : '/login/callback'}</code>{' '}
        {t('login.notConfigured.after', 'as an OIDC redirect URI.', 'auth')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error ? (
        <FlashBanner key={error} kind="error">
          {error}
        </FlashBanner>
      ) : null}
      <button
        type="button"
        onClick={handleLogin}
        disabled={pending}
        className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
      >
        {pending ? t('login.redirecting', 'Redirecting…', 'auth') : t('login.continueWithBlocks', 'Continue with Blocks', 'auth')}
      </button>
      <button
        type="button"
        onClick={() => router.push('/')}
        className="w-full text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        {t('login.backToHome', 'Back to home', 'auth')}
      </button>
    </div>
  )
}
