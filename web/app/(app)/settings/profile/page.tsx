'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AppShell,
  RequireAuth,
  RequireOnboardingComplete,
} from '@/components/layout/app-shell'
import {
  ProfileField,
  ProfileInput,
  ProfileTextarea,
  profileAlertClassName,
  profileSectionClassName,
} from '@/components/profile/profile-field'
import { ProfilePhotoField } from '@/components/profile/profile-photo-field'
import { ProfileSettingsSkeleton } from '@/components/loading/profile-settings-skeleton'
import { useAuth } from '@/components/providers/auth-provider'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import { getUserRoles } from '@/lib/blocks/auth'
import {
  applyRoleToUserProfiles,
  loadUserProfiles,
  profileItemId,
  readBlocksError,
  saveMenteeProfile,
  saveMentorProfile,
  splitList,
  validateMenteeProfile,
  validateMentorProfile,
  type MenteeProfileRecord,
  type MentorProfileRecord,
  type UserProfiles,
} from '@/lib/profiles'

const emptyMentor = (): MentorProfileRecord => ({
  displayName: '',
  photoFileId: undefined,
  title: '',
  company: '',
  bio: '',
  skills: [],
  languages: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
})

const emptyMentee = (): MenteeProfileRecord => ({
  goals: [],
  interests: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
})

const ProfileSettingsContent = ({ initialProfiles }: { initialProfiles: UserProfiles }) => {
  const { claims } = useAuth()
  const roles = getUserRoles(claims)
  const [userId, setUserId] = useState('')

  const [mentor, setMentor] = useState<MentorProfileRecord>(
    () => initialProfiles.mentor ?? emptyMentor()
  )
  const [mentee, setMentee] = useState<MenteeProfileRecord>(
    () => initialProfiles.mentee ?? emptyMentee()
  )
  const [mentorItemId, setMentorItemId] = useState<string | undefined>(() =>
    profileItemId(initialProfiles.mentor)
  )
  const [menteeItemId, setMenteeItemId] = useState<string | undefined>(() =>
    profileItemId(initialProfiles.mentee)
  )

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    void resolveSessionUser(claims).then((session) => {
      if (session) setUserId(session.userId)
    })
  }, [claims])

  useEffect(() => {
    setMentor(initialProfiles.mentor ?? emptyMentor())
    setMentee(initialProfiles.mentee ?? emptyMentee())
    setMentorItemId(profileItemId(initialProfiles.mentor))
    setMenteeItemId(profileItemId(initialProfiles.mentee))
  }, [initialProfiles])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!userId) return

    setMessage(undefined)
    setError(undefined)

    if (initialProfiles.hasMentorProfile) {
      const mentorValidation = validateMentorProfile(mentor)
      if (!mentorValidation.ok) {
        setError(mentorValidation.message)
        return
      }
    }

    if (initialProfiles.hasMenteeProfile) {
      const menteeValidation = validateMenteeProfile(mentee)
      if (!menteeValidation.ok) {
        setError(menteeValidation.message)
        return
      }
    }

    setSaving(true)
    try {
      if (initialProfiles.hasMentorProfile) {
        await saveMentorProfile(userId, mentor, mentorItemId)
      }
      if (initialProfiles.hasMenteeProfile) {
        await saveMenteeProfile(userId, mentee, menteeItemId)
      }
      setMessage('Profile saved.')
    } catch (caught) {
      setError(readBlocksError(caught))
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoChange = async (photoFileId: string | undefined) => {
    const nextMentor = { ...mentor, photoFileId }
    setMentor(nextMentor)
    setMessage(undefined)
    setError(undefined)

    if (!userId || !mentorItemId) return

    try {
      await saveMentorProfile(userId, nextMentor, mentorItemId)
      setMessage(photoFileId ? 'Photo updated.' : 'Photo removed.')
    } catch (caught) {
      setError(readBlocksError(caught))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Profile settings</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Roles: {roles.join(', ') || 'none'}
        </p>
      </div>

      {error ? <div className={profileAlertClassName.error}>{error}</div> : null}
      {message ? <div className={profileAlertClassName.success}>{message}</div> : null}

      {initialProfiles.hasMentorProfile ? (
        <section className={profileSectionClassName}>
          <h2 className="font-semibold">Mentor profile</h2>
          <ProfilePhotoField
            fileId={mentor.photoFileId}
            displayName={mentor.displayName}
            onFileIdChange={(photoFileId) => void handlePhotoChange(photoFileId)}
            onError={setError}
          />
          <ProfileField label="Display name">
            <ProfileInput
              required
              value={mentor.displayName ?? ''}
              onChange={(e) => setMentor((prev) => ({ ...prev, displayName: e.target.value }))}
            />
          </ProfileField>
          <ProfileField label="Title">
            <ProfileInput
              required
              value={mentor.title ?? ''}
              onChange={(e) => setMentor((prev) => ({ ...prev, title: e.target.value }))}
            />
          </ProfileField>
          <ProfileField label="Company">
            <ProfileInput
              value={mentor.company ?? ''}
              onChange={(e) => setMentor((prev) => ({ ...prev, company: e.target.value }))}
            />
          </ProfileField>
          <ProfileField label="Bio">
            <ProfileTextarea
              value={mentor.bio ?? ''}
              onChange={(e) => setMentor((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </ProfileField>
          <ProfileField label="Skills" hint="Comma-separated tags">
            <ProfileInput
              value={(mentor.skills ?? []).join(', ')}
              onChange={(e) =>
                setMentor((prev) => ({ ...prev, skills: splitList(e.target.value) }))
              }
            />
          </ProfileField>
          <ProfileField label="Languages" hint="Comma-separated tags">
            <ProfileInput
              value={(mentor.languages ?? []).join(', ')}
              onChange={(e) =>
                setMentor((prev) => ({ ...prev, languages: splitList(e.target.value) }))
              }
            />
          </ProfileField>
          <ProfileField label="Timezone">
            <ProfileInput
              value={mentor.timezone ?? ''}
              onChange={(e) => setMentor((prev) => ({ ...prev, timezone: e.target.value }))}
            />
          </ProfileField>
        </section>
      ) : (
        <section className={profileSectionClassName}>
          <h2 className="font-semibold">Mentor profile</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            You have not set up a mentor profile yet.
          </p>
          <Link href="/onboarding?as=mentor" className="text-sm font-medium text-[var(--color-brand)]">
            Become a mentor →
          </Link>
        </section>
      )}

      {initialProfiles.hasMenteeProfile ? (
        <section className={profileSectionClassName}>
          <h2 className="font-semibold">Mentee profile</h2>
          <ProfileField label="Goals" hint="Comma-separated">
            <ProfileInput
              required
              value={(mentee.goals ?? []).join(', ')}
              onChange={(e) =>
                setMentee((prev) => ({ ...prev, goals: splitList(e.target.value) }))
              }
            />
          </ProfileField>
          <ProfileField label="Interests" hint="Comma-separated">
            <ProfileInput
              required
              value={(mentee.interests ?? []).join(', ')}
              onChange={(e) =>
                setMentee((prev) => ({ ...prev, interests: splitList(e.target.value) }))
              }
            />
          </ProfileField>
          <ProfileField label="Timezone">
            <ProfileInput
              value={mentee.timezone ?? ''}
              onChange={(e) => setMentee((prev) => ({ ...prev, timezone: e.target.value }))}
            />
          </ProfileField>
        </section>
      ) : initialProfiles.hasMentorProfile ? null : (
        <section className={profileSectionClassName}>
          <h2 className="font-semibold">Mentee profile</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            You have not set up a mentee profile yet.
          </p>
          <Link href="/onboarding?as=mentee" className="text-sm font-medium text-[var(--color-brand)]">
            Set up mentee profile →
          </Link>
        </section>
      )}

      {initialProfiles.hasMentorProfile || initialProfiles.hasMenteeProfile ? (
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      ) : null}
    </form>
  )
}

const ProfileSettingsPageContent = () => {
  const { claims } = useAuth()
  const [profiles, setProfiles] = useState<UserProfiles | undefined>()
  const [roles, setRoles] = useState<string[]>([])
  const [loadError, setLoadError] = useState<string | undefined>()

  useEffect(() => {
    setLoadError(undefined)
    void resolveSessionUser(claims).then((session) => {
      if (!session) return
      setRoles(session.roles)
      void loadUserProfiles(session.userId)
        .then((loaded) => setProfiles(applyRoleToUserProfiles(loaded, session.roles)))
        .catch((caught) => setLoadError(readBlocksError(caught)))
    })
  }, [claims])

  if (loadError) {
    return (
      <AppShell>
        <div className={profileAlertClassName.error}>{loadError}</div>
      </AppShell>
    )
  }

  if (!profiles) {
    return (
      <AppShell>
        <ProfileSettingsSkeleton />
      </AppShell>
    )
  }

  return (
    <AppShell profiles={profiles} roles={roles}>
      <ProfileSettingsContent initialProfiles={profiles} />
    </AppShell>
  )
}

export default function ProfileSettingsPage() {
  return (
    <RequireAuth>
      <RequireOnboardingComplete>
        <ProfileSettingsPageContent />
      </RequireOnboardingComplete>
    </RequireAuth>
  )
}
