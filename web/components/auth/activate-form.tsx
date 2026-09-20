'use client'

import Link from 'next/link'
import { useEffect, useState, type SyntheticEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  activateAccount,
  resendActivation,
  validateActivationCode,
} from '@/lib/blocks/account'
import { useLocale } from '@/components/providers/localization-provider'
import { FlashBanner } from '@/components/ui/flash-banner'

const inputClassName =
  'w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:ring-offset-2'

export const ActivateForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLocale()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState<boolean | undefined>()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) setCode(urlCode)
  }, [searchParams])

  useEffect(() => {
    if (!code) {
      setValidating(false)
      setValid(undefined)
      return
    }

    setValidating(true)
    void validateActivationCode(code)
      .then((isValid) => {
        setValid(isValid)
      })
      .catch(() => {
        setValid(false)
      })
      .finally(() => {
        setValidating(false)
      })
  }, [code])

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(undefined)
    setMessage(undefined)

    if (password !== confirmPassword) {
      setError(t('activate.error.passwordMismatch', 'Passwords do not match.', 'auth'))
      return
    }

    setPending(true)
    try {
      await activateAccount(code.trim(), password)
      setMessage(t('activate.success', 'Account activated. You can sign in now.', 'auth'))
      router.push('/login?returnTo=%2Fdashboard')
    } catch (caught) {
      setError((caught as Error).message)
      setPending(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) {
      setError(t('activate.error.needEmail', 'Enter your email to resend the activation link.', 'auth'))
      return
    }
    setError(undefined)
    setPending(true)
    try {
      await resendActivation(email.trim())
      setMessage(t('activate.resendSuccess', 'Activation email sent. Check your inbox.', 'auth'))
    } catch (caught) {
      setError((caught as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('activate.title', 'Activate your account', 'auth')}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {t('activate.subtitle', 'Paste the code from your email and choose a password.', 'auth')}
        </p>
      </div>

      {message ? (
        <FlashBanner key={message} kind="success">
          {message}
        </FlashBanner>
      ) : null}
      {error ? (
        <FlashBanner key={error} kind="error">
          {error}
        </FlashBanner>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span>{t('activate.field.code', 'Activation code', 'auth')}</span>
          <input
            required
            className={inputClassName}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>

        {validating ? (
          <p className="text-sm text-[var(--color-text-muted)]">{t('activate.checkingCode', 'Checking code…', 'auth')}</p>
        ) : valid === false ? (
          <p className="text-sm text-[var(--color-danger)]">
            {t('activate.invalidLink', 'This activation link is invalid or expired.', 'auth')}
          </p>
        ) : null}

        <label className="block space-y-1 text-sm">
          <span>{t('activate.field.password', 'Password', 'auth')}</span>
          <input
            required
            type="password"
            autoComplete="new-password"
            className={inputClassName}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span>{t('activate.field.confirmPassword', 'Confirm password', 'auth')}</span>
          <input
            required
            type="password"
            autoComplete="new-password"
            className={inputClassName}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={pending || valid === false}
          className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
        >
          {pending ? t('activate.activating', 'Activating…', 'auth') : t('activate.activateAccount', 'Activate account', 'auth')}
        </button>
      </form>

      <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
        <p className="text-sm text-[var(--color-text-muted)]">{t('activate.needNewLink', 'Need a new link?', 'auth')}</p>
        <label className="block space-y-1 text-sm">
          <span>{t('activate.field.email', 'Email', 'auth')}</span>
          <input
            type="email"
            className={inputClassName}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={pending}
          className="w-full rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-bg-inset)] disabled:opacity-60"
        >
          {t('activate.resend', 'Resend activation email', 'auth')}
        </button>
      </div>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        <Link href="/login" className="font-medium text-[var(--color-brand)] hover:underline">
          {t('activate.backToSignIn', 'Back to sign in', 'auth')}
        </Link>
      </p>
    </div>
  )
}
