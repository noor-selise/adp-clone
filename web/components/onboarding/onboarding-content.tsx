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
import { useLocale } from '@/components/providers/localization-provider'
import { LanguageMenu } from '@/components/language/language-menu'
import { Container } from '@/components/layout/container'
import { MobileNavDrawer } from '@/components/layout/mobile-nav-drawer'
import { BrandLockup } from '@/components/brand/brand-lockup'

const MenuIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5 shrink-0 fill-none stroke-current"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </svg>
)

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
  const { t } = useLocale()
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
  const [drawerOpen, setDrawerOpen] = useState(false)
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

      void fetchProfilePresence(session.userId)
        .then((profiles) => {
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
        .catch((caught) => {
          setError(readBlocksError(caught))
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
      setError(
        validation.message === 'Display name is required.'
          ? t('error.displayNameRequired', validation.message, 'onboarding')
          : t('error.titleRequired', validation.message, 'onboarding')
      )
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
      setError(
        t(
          'error.mentorOnly',
          'Your account is set up as a mentor only. Mentee profiles are not available.',
          'onboarding'
        )
      )
      return
    }

    const goals = splitList(goalsText)
    const interests = splitList(interestsText)
    const validation = validateMenteeProfile({ goals, interests })
    if (!validation.ok) {
      setError(
        validation.message === 'Add at least one goal.'
          ? t('error.goalRequired', validation.message, 'onboarding')
          : t('error.interestRequired', validation.message, 'onboarding')
      )
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

  const handleSignOut = () => void logout().then(() => router.push('/'))

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <Container variant="page" className="flex items-center justify-between py-4">
          <BrandLockup showName={false} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden min-h-11 items-center rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg-inset)] md:flex"
            >
              {t('nav.signOut', 'Sign out', 'common')}
            </button>
            <LanguageMenu />
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('nav.openMenu', 'Open menu', 'common')}
              aria-expanded={drawerOpen}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-inset)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] md:hidden"
            >
              <span className="rtl:-scale-x-100">
                <MenuIcon />
              </span>
            </button>
          </div>
        </Container>
      </header>
      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        label={t('nav.menu', 'Menu', 'common')}
      >
        <button
          type="button"
          onClick={handleSignOut}
          className="flex min-h-11 w-full items-center justify-center rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-bg-inset)]"
        >
          {t('nav.signOut', 'Sign out', 'common')}
        </button>
      </MobileNavDrawer>

      <Container variant="form" className="py-12">
        {error ? (
          <div className={`mb-6 ${profileAlertClassName.error}`}>{error}</div>
        ) : null}

        {mode === 'picker' ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold">{t('picker.title', 'How do you want to start?', 'onboarding')}</h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {t(
                  'picker.subtitle',
                  'Pick one path to finish your profile. You can add the other later.',
                  'onboarding'
                )}
              </p>
            </div>
            <div className="grid gap-4">
              <button
                type="button"
                onClick={() => handlePickTrack('mentee')}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 text-start transition hover:border-[var(--color-brand)] hover:shadow-sm"
              >
                <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-brand)]">
                  {t('picker.menteeEyebrow', 'Get guidance', 'onboarding')}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{t('picker.menteeTitle', 'I want a mentor', 'onboarding')}</h2>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {t('picker.menteeBody', 'Share your goals so we can get you ready to connect.', 'onboarding')}
                </p>
              </button>
              <button
                type="button"
                onClick={() => handlePickTrack('mentor')}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-6 text-start transition hover:border-[var(--color-brand)] hover:shadow-sm"
              >
                <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-brand)]">
                  {t('picker.mentorEyebrow', 'Give back', 'onboarding')}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{t('picker.mentorTitle', 'Become a mentor', 'onboarding')}</h2>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {t('picker.mentorBody', 'Tell us how you show up so mentees know who you are.', 'onboarding')}
                </p>
              </button>
            </div>
          </div>
        ) : null}

        {mode === 'mentor' ? (
          <form onSubmit={handleMentorSubmit} className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold">{t('mentor.title', 'Set up your mentor profile', 'onboarding')}</h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {t(
                  'mentor.subtitle',
                  'A few details so mentees know who you are. You can add more later.',
                  'onboarding'
                )}
              </p>
            </div>
            <ProfileField label={t('field.displayName', 'Display name', 'onboarding')}>
              <ProfileInput
                required
                dir="auto"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </ProfileField>
            <ProfileField label={t('field.title', 'Title', 'onboarding')}>
              <ProfileInput
                required
                dir="auto"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('mentor.titlePlaceholder', 'Senior Product Designer', 'onboarding')}
              />
            </ProfileField>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
            >
              {saving ? t('saving', 'Saving…', 'onboarding') : t('continue', 'Continue to dashboard', 'onboarding')}
            </button>
          </form>
        ) : null}

        {mode === 'mentee' ? (
          <form onSubmit={handleMenteeSubmit} className="space-y-5">
            <div>
              <h1 className="text-2xl font-semibold">
                {t('mentee.title', 'Tell us what you are working toward', 'onboarding')}
              </h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {t(
                  'mentee.subtitle',
                  'A starting point for your next chapter. You do not need it all figured out.',
                  'onboarding'
                )}
              </p>
            </div>
            <ProfileField label={t('field.goals', 'Goals', 'onboarding')} hint={t('field.commaHint', 'Comma-separated', 'onboarding')}>
              <ProfileInput
                required
                dir="auto"
                value={goalsText}
                onChange={(e) => setGoalsText(e.target.value)}
                placeholder={t('mentee.goalsPlaceholder', 'Career growth, leadership, portfolio review', 'onboarding')}
              />
            </ProfileField>
            <ProfileField label={t('field.interests', 'Interests', 'onboarding')} hint={t('field.commaHint', 'Comma-separated', 'onboarding')}>
              <ProfileInput
                required
                dir="auto"
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                placeholder={t('mentee.interestsPlaceholder', 'Product design, UX research, AI', 'onboarding')}
              />
            </ProfileField>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
            >
              {saving ? t('saving', 'Saving…', 'onboarding') : t('continue', 'Continue to dashboard', 'onboarding')}
            </button>
          </form>
        ) : null}
      </Container>
    </div>
  )
}
