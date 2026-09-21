'use client'

import { useEffect, useState, type SyntheticEvent } from 'react'
import Link from 'next/link'
import {
  AppShell,
  RequireAuth,
  RequireOnboardingComplete,
} from '@/components/layout/app-shell'
import { Container } from '@/components/layout/container'
import {
  ProfileField,
  ProfileInput,
  ProfileTextarea,
  profileSectionClassName,
} from '@/components/profile/profile-field'
import { ProfilePhotoField } from '@/components/profile/profile-photo-field'
import { FlashBanner } from '@/components/ui/flash-banner'
import { ProfileSettingsSkeleton } from '@/components/loading/profile-settings-skeleton'
import { useAuth } from '@/components/providers/auth-provider'
import { useLocale } from '@/components/providers/localization-provider'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import {
  applyRoleToUserProfiles,
  loadUserProfiles,
  profileItemId,
  readBlocksError,
  saveMenteeProfile,
  saveMentorProfile,
  splitList,
  normalizeStringList,
  validateMenteeProfile,
  validateMentorProfile,
  type MenteeProfileRecord,
  type MentorProfileRecord,
  type UserProfiles,
} from '@/lib/profiles'
import { interestBadgeLabels, SKILL_CATALOG } from '@/lib/profiles/skill-catalog'
import { hasMenteeRole, hasMentorRole } from '@/lib/onboarding/gate'

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
  photoFileId: undefined,
  goals: [],
  interests: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
})

const ProfileSettingsContent = ({
  initialProfiles,
  roles,
}: {
  initialProfiles: UserProfiles
  roles: string[]
}) => {
  const { claims } = useAuth()
  const { t } = useLocale()
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

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!userId) return

    setMessage(undefined)
    setError(undefined)

    if (initialProfiles.hasMentorProfile) {
      const mentorValidation = validateMentorProfile(mentor)
      if (!mentorValidation.ok) {
        setError(
          mentorValidation.message === 'Display name is required.'
            ? t('error.displayNameRequired', mentorValidation.message, 'profile')
            : t('error.titleRequired', mentorValidation.message, 'profile')
        )
        return
      }
    }

    if (initialProfiles.hasMenteeProfile) {
      const nextMentee = {
        ...mentee,
        goals: normalizeStringList(mentee.goals ?? []),
        interests: normalizeStringList(mentee.interests ?? []),
      }
      const menteeValidation = validateMenteeProfile(nextMentee)
      if (!menteeValidation.ok) {
        setError(
          menteeValidation.message === 'Add at least one goal.'
            ? t('error.goalRequired', menteeValidation.message, 'profile')
            : t('error.interestRequired', menteeValidation.message, 'profile')
        )
        return
      }
    }

    setSaving(true)
    try {
      if (initialProfiles.hasMentorProfile) {
        await saveMentorProfile(userId, mentor, mentorItemId)
      }
      if (initialProfiles.hasMenteeProfile && menteeItemId) {
        await saveMenteeProfile(
          userId,
          {
            ...mentee,
            goals: normalizeStringList(mentee.goals ?? []),
            interests: normalizeStringList(mentee.interests ?? []),
          },
          menteeItemId
        )
      }
      setMessage(t('saved', 'Profile saved.', 'profile'))
    } catch (caught) {
      setError(readBlocksError(caught))
    } finally {
      setSaving(false)
    }
  }

  const handleInterestToggle = (label: string) => {
    setMentee((prev) => {
      const selected = new Set(normalizeStringList(prev.interests ?? []))
      if (selected.has(label)) selected.delete(label)
      else selected.add(label)
      return { ...prev, interests: [...selected] }
    })
  }

  const handlePhotoChange = async (photoFileId: string | undefined) => {
    const nextMentor = { ...mentor, photoFileId }
    setMentor(nextMentor)
    setMessage(undefined)
    setError(undefined)

    if (!userId || !mentorItemId) return

    try {
      await saveMentorProfile(userId, nextMentor, mentorItemId)
      setMessage(photoFileId ? t('photoUpdated', 'Photo updated.', 'profile') : t('photoRemoved', 'Photo removed.', 'profile'))
    } catch (caught) {
      setError(readBlocksError(caught))
    }
  }

  const handleMenteePhotoChange = async (photoFileId: string | undefined) => {
    const nextMentee = { ...mentee, photoFileId }
    setMentee(nextMentee)
    setMessage(undefined)
    setError(undefined)

    if (!userId || !menteeItemId) return

    try {
      await saveMenteeProfile(userId, nextMentee, menteeItemId)
      setMessage(photoFileId ? t('photoUpdated', 'Photo updated.', 'profile') : t('photoRemoved', 'Photo removed.', 'profile'))
    } catch (caught) {
      setError(readBlocksError(caught))
    }
  }

  const showMentorForm = initialProfiles.hasMentorProfile
  const showMentorEmpty = hasMentorRole(roles) && !initialProfiles.hasMentorProfile
  const showMenteeForm = initialProfiles.hasMenteeProfile
  const showMenteeEmpty = hasMenteeRole(roles) && !initialProfiles.hasMenteeProfile
  const interestLabels = interestBadgeLabels(SKILL_CATALOG, mentee.interests ?? [])
  const selectedInterests = new Set(normalizeStringList(mentee.interests ?? []))

  return (
    <Container variant="content">
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{t('title', 'Profile settings', 'profile')}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          {t('roles', 'Roles', 'profile')}: {roles.join(', ') || t('none', 'none', 'profile')}
        </p>
      </div>

      {error ? (
        <FlashBanner key={error} kind="error">
          {error}
        </FlashBanner>
      ) : null}
      {message ? (
        <FlashBanner key={message} kind="success">
          {message}
        </FlashBanner>
      ) : null}

      {showMentorForm ? (
        <section className={profileSectionClassName}>
          <h2 className="font-semibold">{t('mentor.title', 'Mentor profile', 'profile')}</h2>
          <ProfilePhotoField
            fileId={mentor.photoFileId}
            displayName={mentor.displayName}
            onFileIdChange={(photoFileId) => void handlePhotoChange(photoFileId)}
            onError={setError}
          />
          <ProfileField label={t('field.displayName', 'Display name', 'profile')}>
            <ProfileInput
              required
              dir="auto"
              value={mentor.displayName ?? ''}
              onChange={(e) => setMentor((prev) => ({ ...prev, displayName: e.target.value }))}
            />
          </ProfileField>
          <ProfileField label={t('field.title', 'Title', 'profile')}>
            <ProfileInput
              required
              dir="auto"
              value={mentor.title ?? ''}
              onChange={(e) => setMentor((prev) => ({ ...prev, title: e.target.value }))}
            />
          </ProfileField>
          <ProfileField label={t('field.company', 'Company', 'profile')}>
            <ProfileInput
              dir="auto"
              value={mentor.company ?? ''}
              onChange={(e) => setMentor((prev) => ({ ...prev, company: e.target.value }))}
            />
          </ProfileField>
          <ProfileField label={t('field.bio', 'Bio', 'profile')}>
            <ProfileTextarea
              dir="auto"
              value={mentor.bio ?? ''}
              onChange={(e) => setMentor((prev) => ({ ...prev, bio: e.target.value }))}
            />
          </ProfileField>
          <ProfileField label={t('field.skills', 'Skills', 'profile')} hint={t('field.commaTagsHint', 'Comma-separated tags', 'profile')}>
            <ProfileInput
              dir="auto"
              value={(mentor.skills ?? []).join(', ')}
              onChange={(e) =>
                setMentor((prev) => ({ ...prev, skills: splitList(e.target.value) }))
              }
            />
          </ProfileField>
          <ProfileField label={t('field.languages', 'Languages', 'profile')} hint={t('field.commaTagsHint', 'Comma-separated tags', 'profile')}>
            <ProfileInput
              dir="auto"
              value={(mentor.languages ?? []).join(', ')}
              onChange={(e) =>
                setMentor((prev) => ({ ...prev, languages: splitList(e.target.value) }))
              }
            />
          </ProfileField>
          <ProfileField label={t('field.timezone', 'Timezone', 'profile')}>
            <ProfileInput
              value={mentor.timezone ?? ''}
              onChange={(e) => setMentor((prev) => ({ ...prev, timezone: e.target.value }))}
            />
          </ProfileField>
        </section>
      ) : showMentorEmpty ? (
        <section className={profileSectionClassName}>
          <h2 className="font-semibold">{t('mentor.title', 'Mentor profile', 'profile')}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {t('mentor.empty', 'You have not set up a mentor profile yet.', 'profile')}
          </p>
          <Link href="/onboarding?as=mentor" className="text-sm font-medium text-[var(--color-brand)]">
            {t('becomeMentor', 'Become a mentor', 'profile')}
            <span aria-hidden className="inline-block rtl:-scale-x-100"> →</span>
          </Link>
        </section>
      ) : null}

      {showMenteeForm ? (
        <section className={profileSectionClassName}>
          <h2 className="font-semibold">{t('mentee.title', 'Mentee profile', 'profile')}</h2>
          <ProfilePhotoField
            fileId={mentee.photoFileId}
            displayName={mentee.displayName}
            tags="profile,mentee"
            onFileIdChange={(photoFileId) => void handleMenteePhotoChange(photoFileId)}
            onError={setError}
          />
          <ProfileField label={t('field.goals', 'Goals', 'profile')} hint={t('field.commaHint', 'Comma-separated', 'profile')}>
            <ProfileInput
              required
              dir="auto"
              value={(mentee.goals ?? []).join(', ')}
              onChange={(e) =>
                setMentee((prev) => ({ ...prev, goals: splitList(e.target.value) }))
              }
            />
          </ProfileField>
          <ProfileField label={t('field.interests', 'Interests', 'profile')}>
            <div className="flex flex-wrap gap-2">
              {interestLabels.map((label) => {
                const pressed = selectedInterests.has(label)
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={pressed}
                    dir="auto"
                    onClick={() => handleInterestToggle(label)}
                    className={
                      pressed
                        ? 'rounded-full bg-[var(--color-brand)] px-2.5 py-1 text-xs font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]'
                        : 'rounded-full bg-[var(--color-bg-inset)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]'
                    }
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </ProfileField>
          <ProfileField label={t('field.timezone', 'Timezone', 'profile')}>
            <ProfileInput
              value={mentee.timezone ?? ''}
              onChange={(e) => setMentee((prev) => ({ ...prev, timezone: e.target.value }))}
            />
          </ProfileField>
        </section>
      ) : showMenteeEmpty ? (
        <section className={profileSectionClassName}>
          <h2 className="font-semibold">{t('mentee.title', 'Mentee profile', 'profile')}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {t('mentee.empty', 'You have not set up a mentee profile yet.', 'profile')}
          </p>
          <Link href="/onboarding?as=mentee" className="text-sm font-medium text-[var(--color-brand)]">
            {t('setupMentee', 'Set up mentee profile', 'profile')}
            <span aria-hidden className="inline-block rtl:-scale-x-100"> →</span>
          </Link>
        </section>
      ) : null}

      {initialProfiles.hasMentorProfile || initialProfiles.hasMenteeProfile ? (
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-hover)] disabled:opacity-60"
        >
          {saving ? t('saving', 'Saving…', 'profile') : t('save', 'Save profile', 'profile')}
        </button>
      ) : null}
    </form>
    </Container>
  )
}

const ProfileSettingsPageContent = () => {
  const { claims } = useAuth()
  const { t } = useLocale()
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

  if (!profiles) {
    return (
      <AppShell>
        {loadError ? (
          <div className="space-y-4">
            <FlashBanner key={loadError} kind="error">
              {loadError}
            </FlashBanner>
            <p className="text-sm text-[var(--color-text-muted)]">
              {t('loadFailed', 'Could not load your profile. Refresh the page.', 'profile')}
            </p>
          </div>
        ) : (
          <ProfileSettingsSkeleton />
        )}
      </AppShell>
    )
  }

  return (
    <AppShell profiles={profiles} roles={roles}>
      <ProfileSettingsContent initialProfiles={profiles} roles={roles} />
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
