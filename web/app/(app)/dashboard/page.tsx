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

const DashboardContent = () => {
  const { claims } = useAuth()
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
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-[var(--color-text-muted)]">
            Roles: {roleLabel} · {me?.permissions?.length ?? 0} permissions
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {showMentor && mentorProfile ? (
            <MentorProfileCard profile={mentorProfile} />
          ) : showMentor ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
              <h2 className="font-semibold">Mentor</h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Update your mentor profile for the directory.
              </p>
              <a
                href="/settings/profile"
                className="mt-4 inline-block text-sm font-medium text-[var(--color-brand)]"
              >
                Edit profile →
              </a>
            </div>
          ) : null}

          {showMentee ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
              <h2 className="font-semibold">Mentee</h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Your mentee profile is ready. Finding mentors is next.
              </p>
              <a
                href="/settings/profile"
                className="mt-4 inline-block text-sm font-medium text-[var(--color-brand)]"
              >
                Edit profile →
              </a>
            </div>
          ) : null}

          {showAdmin ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
              <h2 className="font-semibold">Admin</h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Manage users in the Blocks portal. App moderation comes in a later phase.
              </p>
              <a
                href="https://os.seliseblocks.com"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-medium text-[var(--color-brand)]"
              >
                Open Blocks OS →
              </a>
            </div>
          ) : null}
        </div>

        {showMentor && assignedMentees.length ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Your mentees</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Mentees currently assigned to you. Profiles are read-only here — mentees edit their own
                profile in settings.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
