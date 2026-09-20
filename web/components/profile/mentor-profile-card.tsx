'use client'

import { useEffect, useState } from 'react'
import type { MentorProfileRecord } from '@/lib/profiles'
import { mentorProfileCompleteness } from '@/lib/profiles/validation'
import { getProfilePhotoUrl } from '@/lib/profiles/photo'
import { useLocale } from '@/components/providers/localization-provider'
import { formatNumber } from '@/lib/i18n/numbers'

type MentorProfileCardProps = {
  profile: MentorProfileRecord
}

const MISSING_KEYS: Record<string, string> = {
  Photo: 'mentor.missing.photo',
  'Display name': 'mentor.missing.displayName',
  Title: 'mentor.missing.title',
  Company: 'mentor.missing.company',
  Bio: 'mentor.missing.bio',
  Skills: 'mentor.missing.skills',
}

export const MentorProfileCard = ({ profile }: MentorProfileCardProps) => {
  const { t } = useLocale()
  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const completeness = mentorProfileCompleteness(profile)

  useEffect(() => {
    if (!profile.photoFileId) {
      setPhotoUrl(undefined)
      return
    }

    let cancelled = false
    void getProfilePhotoUrl(profile.photoFileId)
      .then((url) => {
        if (!cancelled) setPhotoUrl(url)
      })
      .catch(() => {
        if (!cancelled) setPhotoUrl(undefined)
      })

    return () => {
      cancelled = true
    }
  }, [profile.photoFileId])

  const initials =
    (profile.displayName ?? 'M')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'M'

  const skills = (profile.skills ?? []).slice(0, 4)

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-bg-inset)] text-sm font-semibold text-[var(--color-text-muted)]"
          aria-hidden={Boolean(photoUrl)}
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold" dir="auto">
            {profile.displayName || t('mentor.fallbackName', 'Mentor', 'dashboard')}
          </h2>
          <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]" dir="auto">
            {[profile.title, profile.company].filter(Boolean).join(' · ') ||
              t('mentor.addTitleCompany', 'Add your title and company', 'dashboard')}
          </p>
        </div>
      </div>

      {profile.bio ? (
        <p className="mt-4 line-clamp-2 text-sm text-[var(--color-text-muted)]" dir="auto">
          {profile.bio}
        </p>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          {t(
            'mentor.emptyBio',
            'Your mentor profile is live. Add a bio so mentees know how you can help.',
            'dashboard'
          )}
        </p>
      )}

      {skills.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              dir="auto"
              className="rounded-full bg-[var(--color-bg-inset)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <span>{t('mentor.completeness', 'Profile completeness', 'dashboard')}</span>
          <span>{formatNumber(completeness.percent)}%</span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-bg-inset)]"
          role="progressbar"
          aria-valuenow={completeness.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('mentor.completeness', 'Profile completeness', 'dashboard')}
        >
          <div
            className="h-full rounded-full bg-[var(--color-brand)] transition-all"
            style={{ width: `${completeness.percent}%` }}
          />
        </div>
        {completeness.missing.length ? (
          <p className="mt-2 text-xs text-[var(--color-text-faint)]">
            {t('mentor.stillToAdd', 'Still to add', 'dashboard')}:{' '}
            {completeness.missing
              .map((label) => t(MISSING_KEYS[label] ?? label, label, 'dashboard'))
              .join(', ')}
          </p>
        ) : null}
      </div>

      <a
        href="/settings/profile"
        className="mt-4 inline-block text-sm font-medium text-[var(--color-brand)]"
      >
        {t('editProfile', 'Edit profile', 'dashboard')}
        <span aria-hidden className="inline-block rtl:-scale-x-100"> →</span>
      </a>
    </div>
  )
}
