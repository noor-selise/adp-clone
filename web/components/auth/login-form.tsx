'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { isLoginConfigured } from '@/lib/blocks/config'

export const LoginForm = () => {
  const { login } = useAuth()
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
        Login is not configured. Register{' '}
        <code className="rounded bg-white px-1">{typeof window !== 'undefined' ? `${window.location.origin}/login/callback` : '/login/callback'}</code>{' '}
        as an OIDC redirect URI.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}
      <button
        type="button"
        onClick={handleLogin}
        disabled={pending}
        className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
      >
        {pending ? 'Redirecting…' : 'Continue with Blocks'}
      </button>
      <button
        type="button"
        onClick={() => router.push('/')}
        className="w-full text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        Back to home
      </button>
    </div>
  )
}
