'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  checkEmailAvailable,
  signupAccount,
} from '@/lib/blocks/account'
import {
  parseRegisterTrack,
  persistRegisterTrack,
  registerPath,
  type RegisterTrack,
} from '@/lib/onboarding/track'
import { useLocale } from '@/components/providers/localization-provider'

const inputClassName =
  'w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:ring-offset-2'

export const RegisterForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLocale()
  const track = useMemo(
    () => parseRegisterTrack(searchParams.get('as')) ?? 'mentee',
    [searchParams]
  )

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [pendingEmail, setPendingEmail] = useState<string | undefined>()

  const copy = track === 'mentor'
    ? {
        title: t('register.mentor.title', 'Become a mentor', 'auth'),
        subtitle: t('register.mentor.subtitle', 'Be someone in their corner.', 'auth'),
      }
    : {
        title: t('register.mentee.title', 'Get started', 'auth'),
        subtitle: t('register.mentee.subtitle', 'Find your next step with a mentor.', 'auth'),
      }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)

    if (password !== confirmPassword) {
      setError(t('register.error.passwordMismatch', 'Passwords do not match.', 'auth'))
      return
    }

    setPending(true)
    try {
      const available = await checkEmailAvailable(email.trim())
      if (!available) {
        setError(t('register.error.emailExists', 'An account with this email already exists.', 'auth'))
        setPending(false)
        return
      }

      persistRegisterTrack(track)
      const outcome = await signupAccount({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })

      if (outcome.kind === 'error') {
        setError(outcome.message)
        setPending(false)
        return
      }

      if (outcome.kind === 'pending') {
        setPendingEmail(outcome.email)
        setPending(false)
        return
      }

      router.push(`/login?returnTo=${encodeURIComponent('/onboarding')}`)
    } catch (caught) {
      setError((caught as Error).message)
      setPending(false)
    }
  }

  if (pendingEmail) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-semibold">{t('register.checkEmail.title', 'Check your email', 'auth')}</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          {t('register.checkEmail.before', 'We sent an activation link to', 'auth')}{' '}
          <strong>{pendingEmail}</strong>.{' '}
          {t('register.checkEmail.after', 'Open it to activate your account, then sign in.', 'auth')}
        </p>
        <Link
          href="/activate"
          className="inline-flex rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)]"
        >
          {t('register.enterActivationCode', 'Enter activation code', 'auth')}
        </Link>
        <p>
          <Link href="/login" className="text-sm font-medium text-[var(--color-brand)] hover:underline">
            {t('register.goToSignIn', 'Go to sign in', 'auth')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{copy.title}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{copy.subtitle}</p>
      </div>

      <TrackToggle track={track} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
          {error.includes('already exists') ? (
            <p className="mt-2">
              <Link href="/login" className="font-medium text-[var(--color-brand)] hover:underline">
                {t('register.logInInstead', 'Log in instead', 'auth')}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>{t('register.field.firstName', 'First name', 'auth')}</span>
          <input
            required
            autoComplete="given-name"
            className={inputClassName}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t('register.field.lastName', 'Last name', 'auth')}</span>
          <input
            required
            autoComplete="family-name"
            className={inputClassName}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>{t('register.field.email', 'Email', 'auth')}</span>
        <input
          required
          type="email"
          autoComplete="email"
          className={inputClassName}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>{t('register.field.password', 'Password', 'auth')}</span>
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
        <span>{t('register.field.confirmPassword', 'Confirm password', 'auth')}</span>
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
        disabled={pending}
        className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
      >
        {pending ? t('register.creatingAccount', 'Creating account…', 'auth') : t('register.createAccount', 'Create account', 'auth')}
      </button>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        {t('register.haveAccount', 'Already have an account?', 'auth')}{' '}
        <Link href="/login" className="font-medium text-[var(--color-brand)] hover:underline">
          {t('register.logIn', 'Log in', 'auth')}
        </Link>
      </p>
    </form>
  )
}

const TrackToggle = ({ track }: { track: RegisterTrack }) => {
  const { t } = useLocale()
  return (
    <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-1 text-sm">
      <Link
        href={registerPath('mentee')}
        className={`flex-1 rounded-md px-3 py-2 text-center font-medium ${
          track === 'mentee'
            ? 'bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
        }`}
      >
        {t('register.track.mentee', 'Find a mentor', 'auth')}
      </Link>
      <Link
        href={registerPath('mentor')}
        className={`flex-1 rounded-md px-3 py-2 text-center font-medium ${
          track === 'mentor'
            ? 'bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm'
            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
        }`}
      >
        {t('register.track.mentor', 'Become a mentor', 'auth')}
      </Link>
    </div>
  )
}
