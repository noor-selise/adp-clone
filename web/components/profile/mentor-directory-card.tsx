'use client'

import Link from 'next/link'
import type { MentorProfileRecord } from '@/lib/profiles'
import { profileItemId } from '@/lib/profiles'
import { recordUserId } from '@/lib/profiles/collection'
import { useLocale } from '@/components/providers/localization-provider'

type MentorDirectoryCardProps = {
  profile: MentorProfileRecord
}

const cardClassName =
  'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5 shadow-[var(--shadow-sm)]'

export const MentorDirectoryCard = ({ profile }: MentorDirectoryCardProps) => {
  const { t } = useLocale()
  const key = profileItemId(profile) ?? profile.userId ?? profile.displayName ?? 'mentor'
  const fallbackName = t('mentor.fallbackName', 'Mentor', 'dashboard')
  const displayName = profile.displayName || fallbackName
  const skills = (profile.skills ?? []).slice(0, 4)
  const userId = recordUserId(profile)
  const label = `${t('directory.cardLabel', 'Mentor in the directory', 'dashboard')} ${displayName}`

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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-inset)] text-sm font-semibold text-[var(--color-text-muted)]"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold" dir="auto">
            {displayName}
          </h3>
          {profile.title || profile.company ? (
            <p className="mt-1 truncate text-sm text-[var(--color-text-muted)]" dir="auto">
              {[profile.title, profile.company].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </div>
      </div>

      {profile.bio ? (
        <p className="mt-4 line-clamp-2 text-sm text-[var(--color-text-muted)]" dir="auto">
          {profile.bio}
        </p>
      ) : null}

      {skills.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={`${key}-${skill}`}
              dir="auto"
              className="rounded-full bg-[var(--color-bg-inset)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : null}
    </>
  )

  if (userId) {
    return (
      <Link
        href={`/mentors/${encodeURIComponent(userId)}`}
        className={`${cardClassName} block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]`}
        aria-label={label}
      >
        {body}
      </Link>
    )
  }

  return (
    <article className={cardClassName} aria-label={label}>
      {body}
    </article>
  )
}
