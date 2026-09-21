'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  AppShell,
  RequireAuth,
  RequireOnboardingComplete,
} from '@/components/layout/app-shell'
import { Container } from '@/components/layout/container'
import { MentorDirectoryCard } from '@/components/profile/mentor-directory-card'
import { MentorDirectorySkeleton } from '@/components/loading/mentor-directory-skeleton'
import { useAuth } from '@/components/providers/auth-provider'
import { FlashBanner } from '@/components/ui/flash-banner'
import { useLocale } from '@/components/providers/localization-provider'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import { formatNumber } from '@/lib/i18n/numbers'
import {
  applyMentorDirectoryQuery,
  distinctLanguages,
  distinctSkills,
  distinctTimezones,
  type MentorDirectorySort,
} from '@/lib/mentors/directory-model'
import {
  applyRoleToProfilePresence,
  type ProfilePresence,
} from '@/lib/onboarding/gate'
import {
  listAllMentorProfiles,
  loadUserProfiles,
  type MentorProfileRecord,
} from '@/lib/profiles'

const SEARCH_DEBOUNCE_MS = 300

type DirectoryLoad =
  | { status: 'loading' }
  | { status: 'forbidden' }
  | { status: 'failed' }
  | {
      status: 'ready'
      mentors: MentorProfileRecord[]
      interests: string[]
      profiles: ProfilePresence
      roles: string[]
    }

const csvParam = (value: string | null): string[] =>
  (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

const MentorsDirectoryContent = () => {
  const { claims } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [load, setLoad] = useState<DirectoryLoad>({ status: 'loading' })
  const urlSearch = searchParams.get('q') ?? ''
  const [searchDraft, setSearchDraft] = useState(urlSearch)

  const skills = csvParam(searchParams.get('skills'))
  const languages = csvParam(searchParams.get('languages'))
  const timezone = searchParams.get('timezone') ?? ''
  const sort: MentorDirectorySort =
    searchParams.get('sort') === 'skillMatch' ? 'skillMatch' : 'name'
  const page = Number(searchParams.get('page') ?? '1')

  useEffect(() => {
    setSearchDraft(urlSearch)
  }, [urlSearch])

  const replaceParams = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString())
    mutate(next)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const resetPageAndSet = (key: string, value: string | null) => {
    replaceParams((next) => {
      next.delete('page')
      if (!value) next.delete(key)
      else next.set(key, value)
    })
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchDraft === urlSearch) return
      resetPageAndSet('q', searchDraft.trim() ? searchDraft : null)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [searchDraft, urlSearch, pathname, router, searchParams])

  useEffect(() => {
    setLoad({ status: 'loading' })
    void resolveSessionUser(claims).then(async (session) => {
      if (!session) {
        setLoad({ status: 'forbidden' })
        return
      }
      try {
        const [profiles, mentors] = await Promise.all([
          loadUserProfiles(session.userId),
          listAllMentorProfiles(),
        ])
        const gated = applyRoleToProfilePresence(profiles, session.roles)
        if (!gated.hasMenteeProfile) {
          setLoad({ status: 'forbidden' })
          return
        }
        setLoad({
          status: 'ready',
          mentors,
          interests: profiles.mentee?.interests ?? [],
          profiles: gated,
          roles: session.roles,
        })
      } catch {
        setLoad({ status: 'failed' })
      }
    })
  }, [claims])

  const result = useMemo(() => {
    if (load.status !== 'ready') return null
    return applyMentorDirectoryQuery(load.mentors, load.interests, {
      search: urlSearch,
      skills,
      languages,
      timezone,
      sort,
      page,
    })
  }, [load, urlSearch, skills, languages, timezone, sort, page])

  const skillOptions =
    load.status === 'ready' ? distinctSkills(load.mentors) : []
  const languageOptions =
    load.status === 'ready' ? distinctLanguages(load.mentors) : []
  const timezoneOptions =
    load.status === 'ready' ? distinctTimezones(load.mentors) : []

  const toggleCsv = (key: string, current: string[], value: string) => {
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]
    resetPageAndSet(key, next.length ? next.join(',') : null)
  }

  const handleClear = () => {
    setSearchDraft('')
    router.replace(pathname, { scroll: false })
  }

  const shellProfiles =
    load.status === 'ready'
      ? load.profiles
      : { hasMentorProfile: false, hasMenteeProfile: false }
  const shellRoles = load.status === 'ready' ? load.roles : []

  return (
    <AppShell profiles={shellProfiles} roles={shellRoles}>
      <Container variant="wide" className="space-y-8">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[var(--color-brand)] hover:underline"
          >
            <span aria-hidden className="inline-block rtl:-scale-x-100">
              ←{' '}
            </span>
            {t('backToDashboard', 'Back to dashboard', 'dashboard')}
          </Link>
          <h1 className="mt-4 text-2xl font-semibold">
            {t('directory.title', 'Browse mentors', 'dashboard')}
          </h1>
          <p className="mt-2 text-[var(--color-text-muted)]">
            {t(
              'directory.subtitle',
              'Search and filter every mentor on MentorMatch. Cards are view only.',
              'dashboard',
            )}
          </p>
        </div>

        {load.status === 'forbidden' ? (
          <FlashBanner key="forbidden" kind="error">
            {t(
              'directory.forbidden',
              'The mentor directory is only available to mentees.',
              'dashboard',
            )}
          </FlashBanner>
        ) : null}

        {load.status === 'failed' ? (
          <FlashBanner key="failed" kind="error">
            {t('directory.failed', "Couldn't load mentors.", 'dashboard')}
          </FlashBanner>
        ) : null}

        {load.status === 'loading' ? <MentorDirectorySkeleton /> : null}

        {load.status === 'ready' && result ? (
          <>
            <form
              className="space-y-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-5"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block text-sm font-medium">
                  {t('directory.search', 'Search by name', 'dashboard')}
                  <input
                    type="search"
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                    autoComplete="off"
                    className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-base font-normal text-[var(--color-text)]"
                  />
                </label>
                <label className="block text-sm font-medium">
                  {t('directory.sort', 'Sort', 'dashboard')}
                  <select
                    value={sort}
                    onChange={(event) => {
                      const next =
                        event.target.value === 'skillMatch'
                          ? 'skillMatch'
                          : 'name'
                      resetPageAndSet('sort', next === 'name' ? null : next)
                    }}
                    className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-base font-normal"
                  >
                    <option value="name">
                      {t('directory.sortName', 'Name A to Z', 'dashboard')}
                    </option>
                    <option value="skillMatch">
                      {t(
                        'directory.sortSkillMatch',
                        'Skill match',
                        'dashboard',
                      )}
                    </option>
                  </select>
                </label>
              </div>

              <fieldset>
                <legend className="text-sm font-medium">
                  {t('directory.skills', 'Skills', 'dashboard')}
                </legend>
                <div className="mt-2 flex flex-wrap gap-3">
                  {skillOptions.map((skill) => (
                    <label
                      key={skill}
                      className="inline-flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={skills.includes(skill)}
                        onChange={() => toggleCsv('skills', skills, skill)}
                      />
                      <span dir="auto">{skill}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium">
                  {t('directory.languages', 'Languages', 'dashboard')}
                </legend>
                <div className="mt-2 flex flex-wrap gap-3">
                  {languageOptions.map((language) => (
                    <label
                      key={language}
                      className="inline-flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={languages.includes(language)}
                        onChange={() =>
                          toggleCsv('languages', languages, language)
                        }
                      />
                      <span dir="auto">{language}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block max-w-sm text-sm font-medium">
                {t('directory.timezone', 'Timezone', 'dashboard')}
                <select
                  value={timezone}
                  onChange={(event) =>
                    resetPageAndSet('timezone', event.target.value || null)
                  }
                  className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-base font-normal"
                >
                  <option value="">
                    {t('directory.anyTimezone', 'Any timezone', 'dashboard')}
                  </option>
                  {timezoneOptions.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={handleClear}
                className="text-sm font-medium text-[var(--color-brand)] hover:underline"
              >
                {t('directory.clear', 'Clear search and filters', 'dashboard')}
              </button>
            </form>

            {result.totalCount === 0 ? (
              <p
                className="text-sm text-[var(--color-text-muted)]"
                role="status"
              >
                {t(
                  'directory.empty',
                  'No mentors match these filters.',
                  'dashboard',
                )}
              </p>
            ) : (
              <>
                <p
                  className="text-sm text-[var(--color-text-muted)]"
                  aria-live="polite"
                >
                  {t('directory.showing', 'Showing', 'dashboard')}{' '}
                  {formatNumber(result.items.length)}{' '}
                  {t('directory.of', 'of', 'dashboard')}{' '}
                  {formatNumber(result.totalCount)}
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {result.items.map((mentor) => (
                    <MentorDirectoryCard
                      key={
                        mentor.itemId ??
                        mentor.ItemId ??
                        mentor.userId ??
                        mentor.displayName
                      }
                      profile={mentor}
                    />
                  ))}
                </div>
                {result.totalPages > 1 ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      disabled={result.page <= 1}
                      onClick={() =>
                        replaceParams((next) => {
                          const previous = result.page - 1
                          if (previous <= 1) next.delete('page')
                          else next.set('page', String(previous))
                        })
                      }
                      className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm disabled:opacity-50"
                    >
                      {t('directory.previous', 'Previous', 'dashboard')}
                    </button>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {t('directory.page', 'Page', 'dashboard')}{' '}
                      {formatNumber(result.page)}{' '}
                      {t('directory.of', 'of', 'dashboard')}{' '}
                      {formatNumber(result.totalPages)}
                    </p>
                    <button
                      type="button"
                      disabled={result.page >= result.totalPages}
                      onClick={() =>
                        replaceParams((next) => {
                          next.set('page', String(result.page + 1))
                        })
                      }
                      className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm disabled:opacity-50"
                    >
                      {t('directory.next', 'Next', 'dashboard')}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </Container>
    </AppShell>
  )
}

export default function MentorsPage() {
  return (
    <RequireAuth>
      <RequireOnboardingComplete>
        <Suspense
          fallback={
            <AppShell>
              <Container variant="wide">
                <MentorDirectorySkeleton />
              </Container>
            </AppShell>
          }
        >
          <MentorsDirectoryContent />
        </Suspense>
      </RequireOnboardingComplete>
    </RequireAuth>
  )
}
