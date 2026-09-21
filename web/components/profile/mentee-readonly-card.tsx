'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { MenteeProfileRecord } from '@/lib/profiles'
import { profileItemId } from '@/lib/profiles'
import { recordUserId } from '@/lib/profiles/collection'
import { getProfilePhotoUrl } from '@/lib/profiles/photo'
import { useLocale } from '@/components/providers/localization-provider'

type MenteeReadonlyCardProps = {
  profile: MenteeProfileRecord
}

export const MenteeReadonlyCard = ({ profile }: MenteeReadonlyCardProps) => {
  const { t } = useLocale()
  const [photoUrl, setPhotoUrl] = useState<string | undefined>()
  const key = profileItemId(profile) ?? profile.userId ?? profile.displayName ?? 'mentee'
  const menteeUserId = recordUserId(profile)
  const goals = profile.goals ?? []
  const interests = profile.interests ?? []
  const href = menteeUserId ? `/mentees/${menteeUserId}` : undefined

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

  const body = (
    <>
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-bg-inset)] text-sm font-semibold text-[var(--color-text-muted)]"
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
          <h3 className="truncate font-semibold" dir="auto">
            {profile.displayName ?? t('mentee.fallbackName', 'Mentee', 'dashboard')}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-text-faint)]">
            {t('mentee.assignedViewOnly', 'Assigned mentee · view only', 'dashboard')}
          </p>
        </div>
      </div>

      {goals.length ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
            {t('mentee.goals', 'Goals', 'dashboard')}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]" dir="auto">{goals.join(' · ')}</p>
        </div>
      ) : null}

      {interests.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {interests.map((interest) => (
            <span
              key={`${key}-${interest}`}
              dir="auto"
              className="rounded-full bg-[var(--color-bg-inset)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]"
            >
              {interest}
            </span>
          ))}
        </div>
      ) : null}

      {href ? (
        <p className="mt-4 text-sm font-medium text-[var(--color-brand)]">
          {t('mentee.viewProfile', 'View profile', 'dashboard')}
          <span aria-hidden className="inline-block rtl:-scale-x-100"> →</span>
        </p>
      ) : null}
    </>
  )

  if (!href) {
    return (
      <article
        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5"
        aria-label={`${t('mentee.cardLabel', 'Mentee profile for', 'dashboard')} ${profile.displayName ?? t('mentee.fallbackName', 'Mentee', 'dashboard')}`}
      >
        {body}
      </article>
    )
  }

  return (
    <Link
      href={href}
      className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 transition hover:border-[var(--color-brand)] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
      aria-label={`${t('mentee.viewCardLabel', 'View mentee profile for', 'dashboard')} ${profile.displayName ?? t('mentee.fallbackName', 'Mentee', 'dashboard')}`}
    >
      {body}
    </Link>
  )
}
