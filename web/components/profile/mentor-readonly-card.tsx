'use client'

import type { MentorProfileRecord } from '@/lib/profiles'
import { profileItemId } from '@/lib/profiles'
import { useLocale } from '@/components/providers/localization-provider'

type MentorReadonlyCardProps = {
  profile: MentorProfileRecord
}

export const MentorReadonlyCard = ({ profile }: MentorReadonlyCardProps) => {
  const { t } = useLocale()
  const key = profileItemId(profile) ?? profile.userId ?? profile.displayName ?? 'mentor'
  const fallbackName = t('mentor.fallbackName', 'Mentor', 'dashboard')
  const displayName = profile.displayName || fallbackName
  const skills = (profile.skills ?? []).slice(0, 4)

  const initials =
    (profile.displayName ?? 'M')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'M'

  return (
    <article
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5"
      aria-label={`${t('mentor.cardLabel', 'Mentor profile for', 'dashboard')} ${displayName}`}
    >
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
          <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-text-faint)]">
            {t('mentor.assignedViewOnly', 'Assigned mentor · view only', 'dashboard')}
          </p>
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
    </article>
  )
}
