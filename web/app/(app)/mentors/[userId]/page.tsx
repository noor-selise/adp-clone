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
import { useLocale } from '@/components/providers/localization-provider'
import { FlashBanner } from '@/components/ui/flash-banner'
import { MentorPublicProfileSkeleton } from '@/components/loading/mentor-public-profile-skeleton'
import { profileSectionClassName } from '@/components/profile/profile-field'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import { applyRoleToProfilePresence } from '@/lib/onboarding/gate'
import { fetchMentorProfile, fetchProfilePresence, type MentorProfileRecord } from '@/lib/profiles'
import { getProfilePhotoUrl } from '@/lib/profiles/photo'
import { recordUserId } from '@/lib/profiles/collection'

type LoadState =
  | { status: 'loading' }
  | { status: 'forbidden' }
  | { status: 'missing' }
  | { status: 'failed' }
  | { status: 'ready'; profile: MentorProfileRecord }

const mentorInitials = (displayName: string | undefined) =>
  (displayName ?? 'M')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'M'

const MentorPublicProfileContent = () => {
  const { claims } = useAuth()
  const { t } = useLocale()
  const params = useParams<{ userId: string }>()
  const rawUserId = typeof params.userId === 'string' ? params.userId : ''
  const mentorUserId = rawUserId.trim()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const [photoFailed, setPhotoFailed] = useState(false)

  useEffect(() => {
    setState({ status: 'loading' })
    setPhotoUrl(undefined)
    setPhotoFailed(false)

    if (!mentorUserId) {
      setState({ status: 'missing' })
      return
    }

    void resolveSessionUser(claims).then(async (session) => {
      if (!session) {
        setState({ status: 'forbidden' })
        return
      }

      try {
        const presence = applyRoleToProfilePresence(
          await fetchProfilePresence(session.userId),
          session.roles
        )
        if (!presence.hasMenteeProfile) {
          setState({ status: 'forbidden' })
          return
        }

        const profile = await fetchMentorProfile(mentorUserId)
        if (!profile) {
          setState({ status: 'missing' })
          return
        }

        setState({ status: 'ready', profile })

        const fileId = profile.photoFileId?.trim()
        if (!fileId) return
        try {
          const url = await getProfilePhotoUrl(fileId)
          if (url) setPhotoUrl(url)
          else setPhotoFailed(true)
        } catch {
          setPhotoFailed(true)
        }
      } catch {
        setState({ status: 'failed' })
      }
    })
  }, [claims, mentorUserId])

  const fallbackName = t('mentor.fallbackName', 'Mentor', 'dashboard')
  const readyName =
    state.status === 'ready' ? state.profile.displayName || fallbackName : fallbackName
  const handlePhotoError = () => {
    setPhotoFailed(true)
  }
  const showPhoto = Boolean(photoUrl) && !photoFailed
  const company =
    state.status === 'ready' && state.profile.company?.trim()
      ? state.profile.company.trim()
      : ''
  const showBadge =
    Boolean(company) && state.status === 'ready' && state.profile.companyVerificationStatus === 'verified'
  const skills = state.status === 'ready' ? (state.profile.skills ?? []).filter(Boolean) : []

  return (
    <AppShell>
      <Container variant="content" className="space-y-6">
        <div>
          <Link
            href="/mentors"
            className="text-sm font-medium text-[var(--color-brand)] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
          >
            <span aria-hidden className="inline-block rtl:-scale-x-100">
              ←{' '}
            </span>
            {t('directory.backToMentors', 'Back to mentors', 'dashboard')}
          </Link>
        </div>

        {state.status === 'loading' ? <MentorPublicProfileSkeleton /> : null}

        {state.status === 'forbidden' ? (
          <FlashBanner key="forbidden" kind="error">
            {t(
              'directory.forbidden',
              'The mentor directory is only available to mentees.',
              'dashboard'
            )}
          </FlashBanner>
        ) : null}

        {state.status === 'missing' ? (
          <FlashBanner key="missing" kind="error">
            {t('directory.profileMissing', 'Mentor profile not found.', 'dashboard')}
          </FlashBanner>
        ) : null}

        {state.status === 'failed' ? (
          <FlashBanner key="failed" kind="error">
            {t('directory.profileFailed', "Couldn't load this mentor.", 'dashboard')}
          </FlashBanner>
        ) : null}

        {state.status === 'ready' ? (
          <section className={profileSectionClassName}>
            <div className="flex items-start gap-4">
              {showPhoto ? (
                <img
                  src={photoUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                  onError={handlePhotoError}
                />
              ) : (
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-inset)] text-lg font-semibold text-[var(--color-text-muted)]"
                  aria-hidden
                >
                  {mentorInitials(state.profile.displayName)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-2xl font-semibold" dir="auto">
                  {readyName}
                </h1>
                {state.profile.title ? (
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]" dir="auto">
                    {state.profile.title}
                  </p>
                ) : null}
                {company ? (
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-muted)]">
                    <span dir="auto">{company}</span>
                    {showBadge ? (
                      <span className="rounded-full bg-[var(--color-success-bg)] px-2 py-0.5 text-xs font-medium text-[var(--color-success)]">
                        {t('directory.verifiedBadge', 'Verified', 'dashboard')}
                      </span>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </div>

            {state.profile.bio ? (
              <p className="text-sm text-[var(--color-text)]" dir="auto">
                {state.profile.bio}
              </p>
            ) : null}

            {skills.length ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={`${recordUserId(state.profile) ?? 'mentor'}-${skill}`}
                    dir="auto"
                    className="rounded-full bg-[var(--color-bg-inset)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </Container>
    </AppShell>
  )
}

export default function MentorPublicProfilePage() {
  return (
    <RequireAuth>
      <RequireOnboardingComplete>
        <MentorPublicProfileContent />
      </RequireOnboardingComplete>
    </RequireAuth>
  )
}
