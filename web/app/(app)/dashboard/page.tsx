'use client'

import { useEffect, useState } from 'react'
import {
  AppShell,
  RequireAuth,
  RequireOnboardingComplete,
} from '@/components/layout/app-shell'
import { MentorProfileCard } from '@/components/profile/mentor-profile-card'
import { MenteeReadonlyCard } from '@/components/profile/mentee-readonly-card'
import { useAuth } from '@/components/providers/auth-provider'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import {
  fetchIamMe,
  hasPermission,
  MENTORMATCH_PERMISSIONS,
  type IamMe,
} from '@/lib/blocks/permissions'
import { dashboardSectionsFromProfiles, applyRoleToProfilePresence, type ProfilePresence } from '@/lib/onboarding/gate'
import { fetchProfilePresence, loadUserProfiles, type MentorProfileRecord, type MenteeProfileRecord } from '@/lib/profiles'
import { fetchAssignedMenteeProfiles } from '@/lib/mentorship/assignments'
import { hasMentorRole } from '@/lib/onboarding/gate'
import { DashboardSkeleton } from '@/components/loading/dashboard-skeleton'
import { useLocale } from '@/components/providers/localization-provider'
import { formatNumber } from '@/lib/i18n/numbers'

const DashboardContent = () => {
  const { claims } = useAuth()
  const { t } = useLocale()
  const [me, setMe] = useState<IamMe | undefined>()
  const [roles, setRoles] = useState<string[]>([])
  const [profiles, setProfiles] = useState<ProfilePresence>({
    hasMentorProfile: false,
    hasMenteeProfile: false,
  })
  const [mentorProfile, setMentorProfile] = useState<MentorProfileRecord | undefined>()
  const [assignedMentees, setAssignedMentees] = useState<MenteeProfileRecord[]>([])
  const [contentReady, setContentReady] = useState(false)

  useEffect(() => {
    void fetchIamMe().then(setMe)
  }, [])

  useEffect(() => {
    setContentReady(false)
    void resolveSessionUser(claims).then(async (session) => {
      if (!session) return
      setRoles(session.roles)

      try {
        const [presence, loaded] = await Promise.all([
          fetchProfilePresence(session.userId),
          loadUserProfiles(session.userId),
        ])
        const gated = applyRoleToProfilePresence(presence, session.roles)
        setProfiles(gated)
        setMentorProfile(loaded.mentor)

        if (hasMentorRole(session.roles)) {
          setAssignedMentees(await fetchAssignedMenteeProfiles(session.userId))
        } else {
          setAssignedMentees([])
        }
      } catch {
        setAssignedMentees([])
      }
      setContentReady(true)
    })
  }, [claims])

  const { showMentor, showMentee } = dashboardSectionsFromProfiles(profiles)
  const showAdmin = hasPermission(me, MENTORMATCH_PERMISSIONS.adminPanel)
  const roleLabel = me?.roles?.length ? me.roles.join(', ') : roles.length ? roles.join(', ') : '…'

  return (
    <AppShell profiles={profiles} roles={roles}>
      {!contentReady ? (
        <DashboardSkeleton />
      ) : (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">{t('title', 'Dashboard', 'dashboard')}</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">
            {t('roles', 'Roles', 'dashboard')}: {roleLabel} · {formatNumber(me?.permissions?.length ?? 0)}{' '}
            {t('permissions', 'permissions', 'dashboard')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showMentor && mentorProfile ? (
            <MentorProfileCard profile={mentorProfile} />
          ) : showMentor ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
              <h2 className="font-semibold">{t('mentor.title', 'Mentor', 'dashboard')}</h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {t('mentor.empty', 'Update your mentor profile for the directory.', 'dashboard')}
              </p>
              <a
                href="/settings/profile"
                className="mt-4 inline-block text-sm font-medium text-[var(--color-brand)]"
              >
                {t('editProfile', 'Edit profile', 'dashboard')}
                <span aria-hidden className="inline-block rtl:-scale-x-100"> →</span>
              </a>
            </div>
          ) : null}

          {showMentee ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
              <h2 className="font-semibold">{t('mentee.title', 'Mentee', 'dashboard')}</h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {t('mentee.ready', 'Your mentee profile is ready. Finding mentors is next.', 'dashboard')}
              </p>
              <a
                href="/settings/profile"
                className="mt-4 inline-block text-sm font-medium text-[var(--color-brand)]"
              >
                {t('editProfile', 'Edit profile', 'dashboard')}
                <span aria-hidden className="inline-block rtl:-scale-x-100"> →</span>
              </a>
            </div>
          ) : null}

          {showAdmin ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
              <h2 className="font-semibold">{t('admin.title', 'Admin', 'dashboard')}</h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {t('admin.body', 'Manage users in the Blocks portal. App moderation comes in a later phase.', 'dashboard')}
              </p>
              <a
                href="https://os.seliseblocks.com"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-medium text-[var(--color-brand)]"
              >
                {t('admin.openOs', 'Open Blocks OS', 'dashboard')}
                <span aria-hidden className="inline-block rtl:-scale-x-100"> →</span>
              </a>
            </div>
          ) : null}
        </div>

        {showMentor && assignedMentees.length ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{t('assigned.title', 'Your mentees', 'dashboard')}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {t(
                  'assigned.subtitle',
                  'Mentees currently assigned to you. Profiles are read-only here. Mentees edit their own profile in settings.',
                  'dashboard'
                )}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assignedMentees.map((mentee) => (
                <MenteeReadonlyCard
                  key={mentee.itemId ?? mentee.ItemId ?? mentee.userId ?? mentee.displayName}
                  profile={mentee}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
      )}
    </AppShell>
  )
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <RequireOnboardingComplete>
        <DashboardContent />
      </RequireOnboardingComplete>
    </RequireAuth>
  )
}
