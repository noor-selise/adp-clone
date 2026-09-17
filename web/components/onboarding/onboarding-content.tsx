'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import { resolveOnboardingTrack, canStartOnboardingTrack } from '@/lib/onboarding/gate'
import {
  createMenteeProfile,
  createMentorProfile,
  defaultTimezone,
  fetchProfilePresence,
  readBlocksError,
  splitList,
  validateMenteeProfile,
  validateMentorProfile,
} from '@/lib/profiles'
import {
  ProfileField,
  ProfileInput,
  profileAlertClassName,
} from '@/components/profile/profile-field'
import {
  clearRegisterTrack,
  parseRegisterTrack,
  persistRegisterTrack,
  readRegisterTrack,
  type RegisterTrack,
} from '@/lib/onboarding/track'
import { OnboardingSkeleton } from '@/components/loading/onboarding-skeleton'


const defaultDisplayName = (claims: Record<string, unknown> | undefined): string => {
  const given = typeof claims?.given_name === 'string' ? claims.given_name : ''
  const family = typeof claims?.family_name === 'string' ? claims.family_name : ''
  const combined = [given, family].filter(Boolean).join(' ')
  if (combined) return combined
  const email = typeof claims?.email === 'string' ? claims.email : ''
  return email.split('@')[0] ?? ''
}

export const OnboardingContent = () => {
  const { status, claims, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryTrack = parseRegisterTrack(searchParams.get('as'))

  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<RegisterTrack | 'picker' | undefined>()
  const [sessionUserId, setSessionUserId] = useState('')
  const [sessionRoles, setSessionRoles] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const [displayName, setDisplayName] = useState('')
  const [title, setTitle] = useState('')
  const [goalsText, setGoalsText] = useState('')
  const [interestsText, setInterestsText] = useState('')
  const timezone = useMemo(() => defaultTimezone(), [])

  useEffect(() => {
    if (status !== 'authenticated') return

    void resolveSessionUser(claims).then((session) => {
      if (!session) {
        setLoading(false)
        return
      }

      setSessionUserId(session.userId)
      setSessionRoles(session.roles)

      void fetchProfilePresence(session.userId).then((profiles) => {
        const track = resolveOnboardingTrack(
          session.roles,
          profiles,
          readRegisterTrack(),
          queryTrack
        )

        if (!track) {
          router.replace('/dashboard')
          return
        }

        setMode(track)
        setDisplayName(defaultDisplayName(claims))
        setLoading(false)
      })
    })
  }, [status, claims, queryTrack, router])

  const handlePickTrack = (track: RegisterTrack) => {
    persistRegisterTrack(track)
    setMode(track)
  }

  const handleMentorSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!sessionUserId) return

    const validation = validateMentorProfile({ displayName, title })
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setSaving(true)
    setError(undefined)
    try {
      await createMentorProfile({
        userId: sessionUserId,
        displayName: displayName.trim(),
        title: title.trim(),
        timezone,
      })
      clearRegisterTrack()
      router.replace('/dashboard')
    } catch (caught) {
      setError(readBlocksError(caught))
      setSaving(false)
    }
  }

  const handleMenteeSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!sessionUserId) return

    if (!canStartOnboardingTrack('mentee', sessionRoles)) {
      setError('Your account is set up as a mentor only. Mentee profiles are not available.')
      return
    }

    const goals = splitList(goalsText)
    const interests = splitList(interestsText)
    const validation = validateMenteeProfile({ goals, interests })
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setSaving(true)
    setError(undefined)
    try {
      await createMenteeProfile({
        userId: sessionUserId,
        goals,
        interests,
        timezone,
      })
      clearRegisterTrack()
      router.replace('/dashboard')
    } catch (caught) {
      setError(readBlocksError(caught))
      setSaving(false)
    }
  }

  if (loading) {
    return <OnboardingSkeleton />
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold">MentorMatch</span>
          <button
            type="button"
            onClick={() => void logout().then(() => router.push('/'))}
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg-inset)]"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-12">
        {error ? (
          <div className={`mb-6 ${profileAlertClassName.error}`}>{error}</div>
        ) : null}

        {mode === 'picker' ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold">How do you want to start?</h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Pick one path to finish your profile. You can add the other later.
              </p>
            </div>
            <div className="grid gap-4">
              <button
                type="button"
                onClick={() => handlePickTrack('mentee')}
                className="rounded-xl border border-[var(--color-border)] bg-white p-6 text-left transition hover:border-[var(--color-brand)] hover:shadow-sm"
              >
                <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-brand)]">
                  Get guidance
                </p>
                <h2 className="mt-2 text-lg font-semibold">I want a mentor</h2>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  Share your goals so we can get you ready to connect.
                </p>
              </button>
              <button
                type="button"
                onClick={() => handlePickTrack('mentor')}
                className="rounded-xl border border-[var(--color-border)] bg-white p-6 text-left transition hover:border-[var(--color-brand)] hover:shadow-sm"
              >
                <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-brand)]">
                  Give back
                </p>
                <h2 className="mt-2 text-lg font-semibold">Become a mentor</h2>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  Tell us how you show up so mentees know who you are.
                </p>
              </button>
            </div>
          </div>
        ) : null}

        {mode === 'mentor' ? (
          <form onSubmit={handleMentorSubmit} className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold">Set up your mentor profile</h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                A few details so mentees know who you are. You can add more later.
              </p>
            </div>
            <ProfileField label="Display name">
              <ProfileInput
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </ProfileField>
            <ProfileField label="Title">
              <ProfileInput
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior Product Designer"
              />
            </ProfileField>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Continue to dashboard'}
            </button>
          </form>
        ) : null}

        {mode === 'mentee' ? (
          <form onSubmit={handleMenteeSubmit} className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold">Tell us what you are working toward</h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                A starting point for your next chapter. You do not need it all figured out.
              </p>
            </div>
            <ProfileField label="Goals" hint="Comma-separated">
              <ProfileInput
                required
                value={goalsText}
                onChange={(e) => setGoalsText(e.target.value)}
                placeholder="Career growth, leadership, portfolio review"
              />
            </ProfileField>
            <ProfileField label="Interests" hint="Comma-separated">
              <ProfileInput
                required
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                placeholder="Product design, UX research, AI"
              />
            </ProfileField>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Continue to dashboard'}
            </button>
          </form>
        ) : null}
      </main>
    </div>
  )
}
