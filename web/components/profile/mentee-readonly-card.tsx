'use client'

import Link from 'next/link'
import type { MenteeProfileRecord } from '@/lib/profiles'
import { profileItemId } from '@/lib/profiles'
import { recordUserId } from '@/lib/profiles/collection'

type MenteeReadonlyCardProps = {
  profile: MenteeProfileRecord
}

export const MenteeReadonlyCard = ({ profile }: MenteeReadonlyCardProps) => {
  const key = profileItemId(profile) ?? profile.userId ?? profile.displayName ?? 'mentee'
  const menteeUserId = recordUserId(profile)
  const goals = profile.goals ?? []
  const interests = profile.interests ?? []
  const href = menteeUserId ? `/mentees/${menteeUserId}` : undefined

  const body = (
    <>
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-inset)] text-sm font-semibold text-[var(--color-text-muted)]"
          aria-hidden
        >
          {(profile.displayName ?? 'M').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{profile.displayName ?? 'Mentee'}</h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-text-faint)]">
            Assigned mentee · view only
          </p>
        </div>
      </div>

      {goals.length ? (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-faint)]">
            Goals
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{goals.join(' · ')}</p>
        </div>
      ) : null}

      {interests.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {interests.map((interest) => (
            <span
              key={`${key}-${interest}`}
              className="rounded-full bg-[var(--color-bg-inset)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]"
            >
              {interest}
            </span>
          ))}
        </div>
      ) : null}

      {href ? (
        <p className="mt-4 text-sm font-medium text-[var(--color-brand)]">View profile →</p>
      ) : null}
    </>
  )

  if (!href) {
    return (
      <article
        className="rounded-xl border border-[var(--color-border)] bg-white p-5"
        aria-label={`Mentee profile for ${profile.displayName ?? 'mentee'}`}
      >
        {body}
      </article>
    )
  }

  return (
    <Link
      href={href}
      className="block rounded-xl border border-[var(--color-border)] bg-white p-5 transition hover:border-[var(--color-brand)] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
      aria-label={`View mentee profile for ${profile.displayName ?? 'mentee'}`}
    >
      {body}
    </Link>
  )
}
