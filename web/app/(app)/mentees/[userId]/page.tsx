'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AppShell,
  RequireAuth,
  RequireOnboardingComplete,
} from '@/components/layout/app-shell'
import { useAuth } from '@/components/providers/auth-provider'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import { hasMentorRole } from '@/lib/onboarding/gate'
import {
  canMentorViewMenteeProfile,
} from '@/lib/mentorship/assignments'
import { fetchMenteeProfile, type MenteeProfileRecord } from '@/lib/profiles'
import {
  profileAlertClassName,
  profileSectionClassName,
} from '@/components/profile/profile-field'
import { MenteeProfileSkeleton } from '@/components/loading/mentee-profile-skeleton'

type LoadState =
  | { status: 'loading' }
  | { status: 'forbidden' }
  | { status: 'missing' }
  | { status: 'ready'; profile: MenteeProfileRecord }

const MenteeProfileViewContent = () => {
  const { claims } = useAuth()
  const params = useParams<{ userId: string }>()
  const menteeUserId = typeof params.userId === 'string' ? params.userId : ''
  const [state, setState] = useState<LoadState>({ status: 'loading' })

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

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            ← Back to dashboard
          </Link>
        </div>

        {state.status === 'loading' ? <MenteeProfileSkeleton /> : null}

        {state.status === 'forbidden' ? (
          <div className={profileAlertClassName.error}>
            You can only view profiles of mentees assigned to you.
          </div>
        ) : null}

        {state.status === 'missing' ? (
          <div className={profileAlertClassName.error}>Mentee profile not found.</div>
        ) : null}

        {state.status === 'ready' ? (
          <section className={profileSectionClassName}>
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-inset)] text-lg font-semibold text-[var(--color-text-muted)]"
                aria-hidden
              >
                {(state.profile.displayName ?? 'M').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold">
                  {state.profile.displayName ?? 'Mentee'}
                </h1>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  Assigned mentee · read-only
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t border-[var(--color-border)] pt-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
                  Goals
                </p>
                <p className="mt-1 text-sm text-[var(--color-text)]">
                  {(state.profile.goals ?? []).length
                    ? (state.profile.goals ?? []).join(' · ')
                    : 'No goals listed yet.'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
                  Interests
                </p>
                {(state.profile.interests ?? []).length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(state.profile.interests ?? []).map((interest) => (
                      <span
                        key={interest}
                        className="rounded-full bg-[var(--color-bg-inset)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    No interests listed yet.
                  </p>
                )}
              </div>

              {state.profile.timezone ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
                    Timezone
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text)]">{state.profile.timezone}</p>
                </div>
              ) : null}
            </div>

            <p className="text-sm text-[var(--color-text-muted)]">
              You can view this profile because the mentee is assigned to you. Only the mentee can
              edit it from their own settings.
            </p>
          </section>
        ) : null}
      </div>
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
