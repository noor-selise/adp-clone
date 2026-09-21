'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AppShell,
  RequireAuth,
  RequireOnboardingComplete,
} from '@/components/layout/app-shell'
import { Container } from '@/components/layout/container'
import { useAuth } from '@/components/providers/auth-provider'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import { hasMentorRole } from '@/lib/onboarding/gate'
import {
  canMentorViewMenteeProfile,
} from '@/lib/mentorship/assignments'
import { fetchMenteeProfile, type MenteeProfileRecord } from '@/lib/profiles'
import { getProfilePhotoUrl } from '@/lib/profiles/photo'
import { profileSectionClassName } from '@/components/profile/profile-field'
import { FlashBanner } from '@/components/ui/flash-banner'
import { MenteeProfileSkeleton } from '@/components/loading/mentee-profile-skeleton'
import { useLocale } from '@/components/providers/localization-provider'

type LoadState =
  | { status: 'loading' }
  | { status: 'forbidden' }
  | { status: 'missing' }
  | { status: 'ready'; profile: MenteeProfileRecord }

const MenteeProfileViewContent = () => {
  const { claims } = useAuth()
  const { t } = useLocale()
  const params = useParams<{ userId: string }>()
  const menteeUserId = typeof params.userId === 'string' ? params.userId : ''
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const photoFileId = state.status === 'ready' ? state.profile.photoFileId : undefined

  useEffect(() => {
    if (!menteeUserId) {
      setState({ status: 'missing' })
      return
    }

    void resolveSessionUser(claims).then(async (session) => {
      if (!session || !hasMentorRole(session.roles)) {
        setState({ status: 'forbidden' })
        return
      }

      const allowed = await canMentorViewMenteeProfile(session.userId, menteeUserId)
      if (!allowed) {
        setState({ status: 'forbidden' })
        return
      }

      const profile = await fetchMenteeProfile(menteeUserId)
      if (!profile) {
        setState({ status: 'missing' })
        return
      }

      setState({ status: 'ready', profile })
    })
  }, [claims, menteeUserId])

  useEffect(() => {
    if (!photoFileId) {
      setPhotoUrl(undefined)
      return
    }

    let cancelled = false
    void getProfilePhotoUrl(photoFileId)
      .then((url) => {
        if (!cancelled) setPhotoUrl(url)
      })
      .catch(() => {
        if (!cancelled) setPhotoUrl(undefined)
      })

    return () => {
      cancelled = true
    }
  }, [photoFileId])

  return (
    <AppShell>
      <Container variant="content" className="space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            <span aria-hidden className="inline-block rtl:-scale-x-100">← </span>
            {t('backToDashboard', 'Back to dashboard', 'dashboard')}
          </Link>
        </div>

        {state.status === 'loading' ? <MenteeProfileSkeleton /> : null}

        {state.status === 'forbidden' ? (
          <FlashBanner key="forbidden" kind="error">
            {t('mentee.forbidden', 'You can only view profiles of mentees assigned to you.', 'dashboard')}
          </FlashBanner>
        ) : null}

        {state.status === 'missing' ? (
          <FlashBanner key="missing" kind="error">
            {t('mentee.missing', 'Mentee profile not found.', 'dashboard')}
          </FlashBanner>
        ) : null}

        {state.status === 'ready' ? (
          <section className={profileSectionClassName}>
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-bg-inset)] text-lg font-semibold text-[var(--color-text-muted)]"
                aria-hidden={Boolean(photoUrl)}
              >
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (state.profile.displayName ?? 'M')
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'M'
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold" dir="auto">
                  {state.profile.displayName ?? t('mentee.fallbackName', 'Mentee', 'dashboard')}
                </h1>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {t('mentee.assignedReadOnly', 'Assigned mentee · read-only', 'dashboard')}
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t border-[var(--color-border)] pt-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
                  {t('mentee.goals', 'Goals', 'dashboard')}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text)]" dir="auto">
                  {(state.profile.goals ?? []).length
                    ? (state.profile.goals ?? []).join(' · ')
                    : t('mentee.noGoals', 'No goals listed yet.', 'dashboard')}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
                  {t('mentee.interests', 'Interests', 'dashboard')}
                </p>
                {(state.profile.interests ?? []).length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(state.profile.interests ?? []).map((interest) => (
                      <span
                        key={interest}
                        dir="auto"
                        className="rounded-full bg-[var(--color-bg-inset)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {t('mentee.noInterests', 'No interests listed yet.', 'dashboard')}
                  </p>
                )}
              </div>

              {state.profile.timezone ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
                    {t('mentee.timezone', 'Timezone', 'dashboard')}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text)]">{state.profile.timezone}</p>
                </div>
              ) : null}
            </div>

            <p className="text-sm text-[var(--color-text-muted)]">
              {t(
                'mentee.note',
                'You can view this profile because the mentee is assigned to you. Only the mentee can edit it from their own settings.',
                'dashboard'
              )}
            </p>
          </section>
        ) : null}
      </Container>
    </AppShell>
  )
}

export default function MenteeProfileViewPage() {
  return (
    <RequireAuth>
      <RequireOnboardingComplete>
        <MenteeProfileViewContent />
      </RequireOnboardingComplete>
    </RequireAuth>
  )
}
