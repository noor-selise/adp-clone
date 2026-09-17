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

const inputClassName =
  'w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:ring-offset-2'

export const RegisterForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
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
        title: 'Become a mentor',
        subtitle: 'Be someone in their corner.',
      }
    : {
        title: 'Get started',
        subtitle: 'Find your next step with a mentor.',
      }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setPending(true)
    try {
      const available = await checkEmailAvailable(email.trim())
      if (!available) {
        setError('An account with this email already exists.')
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
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          We sent an activation link to <strong>{pendingEmail}</strong>. Open it to activate your
          account, then sign in.
        </p>
        <Link
          href="/activate"
          className="inline-flex rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)]"
        >
          Enter activation code
        </Link>
        <p>
          <Link href="/login" className="text-sm font-medium text-[var(--color-brand)] hover:underline">
            Go to sign in
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
                Log in instead
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>First name</span>
          <input
            required
            autoComplete="given-name"
            className={inputClassName}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Last name</span>
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
        <span>Email</span>
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
        <span>Password</span>
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
        <span>Confirm password</span>
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
        {pending ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-[var(--color-brand)] hover:underline">
          Log in
        </Link>
      </p>
    </form>
  )
}

const TrackToggle = ({ track }: { track: RegisterTrack }) => (
  <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-1 text-sm">
    <Link
      href={registerPath('mentee')}
      className={`flex-1 rounded-md px-3 py-2 text-center font-medium ${
        track === 'mentee'
          ? 'bg-white text-[var(--color-text)] shadow-sm'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      Find a mentor
    </Link>
    <Link
      href={registerPath('mentor')}
      className={`flex-1 rounded-md px-3 py-2 text-center font-medium ${
        track === 'mentor'
          ? 'bg-white text-[var(--color-text)] shadow-sm'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      Become a mentor
    </Link>
  </div>
)
