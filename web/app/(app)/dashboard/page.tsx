'use client'

import { useEffect, useState } from 'react'
import {
  AppShell,
  RequireAuth,
  RequireOnboardingComplete,
} from '@/components/layout/app-shell'
import { MentorProfileCard } from '@/components/profile/mentor-profile-card'
import { MenteeReadonlyCard } from '@/components/profile/mentee-readonly-card'
import { MentorReadonlyCard } from '@/components/profile/mentor-readonly-card'
import { useAuth } from '@/components/providers/auth-provider'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import {
  fetchIamMe,
  hasPermission,
  MENTORMATCH_PERMISSIONS,
  type IamMe,
} from '@/lib/blocks/permissions'
import { dashboardSectionsFromProfiles, applyRoleToProfilePresence, hasMentorRole, hasMenteeRole, type ProfilePresence } from '@/lib/onboarding/gate'
import { fetchProfilePresence, loadUserProfiles, type MentorProfileRecord, type MenteeProfileRecord } from '@/lib/profiles'
import { fetchAssignedMenteeProfiles, fetchAssignedMentorProfiles } from '@/lib/mentorship/assignments'
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
  const [assignedMentors, setAssignedMentors] = useState<MentorProfileRecord[]>([])
  const [assignedMentorsFailed, setAssignedMentorsFailed] = useState(false)
  const [contentReady, setContentReady] = useState(false)

  useEffect(() => {
    void fetchIamMe().then(setMe)
  }, [])

  useEffect(() => {
    setContentReady(false)
    void resolveSessionUser(claims).then(async (session) => {
      if (!session) return
      setRoles(session.roles)

      let gated: ProfilePresence = { hasMentorProfile: false, hasMenteeProfile: false }
      try {
        const [presence, loaded] = await Promise.all([
          fetchProfilePresence(session.userId),
          loadUserProfiles(session.userId),
        ])
        gated = applyRoleToProfilePresence(presence, session.roles)
        setProfiles(gated)
        setMentorProfile(loaded.mentor)
      } catch {
        // profiles/mentorProfile stay at their prior values; each assigned list below still tries independently
      }

      await Promise.all([
        (async () => {
          if (!hasMentorRole(session.roles)) {
            setAssignedMentees([])
            return
          }
          try {
            setAssignedMentees(await fetchAssignedMenteeProfiles(session.userId))
          } catch {
            setAssignedMentees([])
          }
        })(),
        (async () => {
          if (!gated.hasMenteeProfile) {
            setAssignedMentors([])
            setAssignedMentorsFailed(false)
            return
          }
          try {
            setAssignedMentors(await fetchAssignedMentorProfiles(session.userId))
            setAssignedMentorsFailed(false)
          } catch {
            setAssignedMentors([])
            setAssignedMentorsFailed(true)
          }
        })(),
      ])

      setContentReady(true)
    })
  }, [claims])

  const { showMentor, showMentee } = dashboardSectionsFromProfiles(profiles)
  const showAdmin = hasPermission(me, MENTORMATCH_PERMISSIONS.adminPanel)
  const roleLabel = me?.roles?.length ? me.roles.join(', ') : roles.length ? roles.join(', ') : '…'

  return (
    <AppShell profiles={profiles} roles={roles}>
      {!contentReady ? (
        <DashboardSkeleton
          showMentorSection={!roles.length || hasMentorRole(roles)}
          showMenteeSection={!roles.length || hasMenteeRole(roles)}
        />
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

        {showMentee ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{t('assignedMentors.title', 'Your mentors', 'dashboard')}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {t(
                  'assignedMentors.subtitle',
                  'Mentors you are currently matched with.',
                  'dashboard'
                )}
              </p>
              <a
                href="/mentors"
                className="mt-2 inline-block text-sm font-medium text-[var(--color-brand)]"
              >
                {t('directory.browse', 'Browse all mentors', 'dashboard')}
                <span aria-hidden className="inline-block rtl:-scale-x-100"> →</span>
              </a>
            </div>
            {assignedMentorsFailed ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                {t(
                  'assignedMentors.failed',
                  "Couldn't load your mentors right now.",
                  'dashboard'
                )}
              </p>
            ) : assignedMentors.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assignedMentors.map((mentor) => (
                  <MentorReadonlyCard
                    key={mentor.itemId ?? mentor.ItemId ?? mentor.userId ?? mentor.displayName}
                    profile={mentor}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                {t('assignedMentors.empty', "You don't have any active mentors yet.", 'dashboard')}
              </p>
            )}
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
