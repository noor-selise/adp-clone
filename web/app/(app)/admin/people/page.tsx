'use client'

import { Suspense, useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  AppShell,
  RequireAuth,
  RequireOnboardingComplete,
} from '@/components/layout/app-shell'
import { Container } from '@/components/layout/container'
import { PeopleAdminTable } from '@/components/admin/people-admin-table'
import { PeopleListSkeleton } from '@/components/loading/people-list-skeleton'
import { ProfileField, ProfileInput } from '@/components/profile/profile-field'
import { FlashBanner } from '@/components/ui/flash-banner'
import { AppDialog } from '@/components/ui/app-dialog'
import { useAuth } from '@/components/providers/auth-provider'
import { useLocale } from '@/components/providers/localization-provider'
import { resolveSessionUser } from '@/lib/blocks/session-user'
import { hasAdminRole, type ProfilePresence } from '@/lib/onboarding/gate'
import {
  applyPeopleQuery,
  joinMenteeRows,
  joinMentorRows,
  parsePeoplePageSize,
  parsePeopleTab,
  peopleFilterChips,
  peopleForRole,
  peopleTimezoneOptions,
  type PeopleRow,
  type PeopleTab,
} from '@/lib/admin/people-model'
import {
  createMentorAccount,
  grantMentorRoleSafe,
  loadIamPeople,
} from '@/lib/admin/people-iam'
import {
  fetchMentorProfile,
  listAllMenteeProfiles,
  listAllMentorProfiles,
  loadUserProfiles,
  profileItemId,
  readBlocksError,
  saveMentorProfile,
} from '@/lib/profiles'

const SEARCH_DEBOUNCE_MS = 300

type GateLoad =
  | { status: 'loading' }
  | { status: 'forbidden' }
  | { status: 'ready'; profiles: ProfilePresence; roles: string[] }

type TabCache =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'ready'; rows: PeopleRow[]; loadedCount: number }

type SetupTask = {
  userId: string
  email: string
  roles: string[]
  needsGrant: boolean
  needsProfile: boolean
  displayName: string
  error?: string
}

type PeopleDialog = 'view' | 'setup' | null

const PeopleContent = () => {
  const { claims } = useAuth()
  const { t } = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [gate, setGate] = useState<GateLoad>({ status: 'loading' })
  const [mentorTab, setMentorTab] = useState<TabCache>({ status: 'idle' })
  const [menteeTab, setMenteeTab] = useState<TabCache>({ status: 'idle' })
  const [loadTick, setLoadTick] = useState(0)
  const urlSearch = searchParams.get('q') ?? ''
  const [searchDraft, setSearchDraft] = useState(urlSearch)
  const [addOpen, setAddOpen] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addName, setAddName] = useState('')
  const [addPassword, setAddPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [creating, setCreating] = useState(false)
  const [addError, setAddError] = useState<string | undefined>()
  const [banner, setBanner] = useState<{ kind: 'error' | 'success'; text: string } | undefined>()
  const [activeRowId, setActiveRowId] = useState<string | undefined>()
  const [dialog, setDialog] = useState<PeopleDialog>(null)
  const [setupTasks, setSetupTasks] = useState<SetupTask[]>([])

  const tab = parsePeopleTab(searchParams.get('tab'))
  const skill = searchParams.get('skill') ?? ''
  const interest = searchParams.get('interest') ?? ''
  const timezone = searchParams.get('timezone') ?? ''
  const page = Number(searchParams.get('page') ?? '1')
  const pageSize = parsePeoplePageSize(searchParams.get('size'))

  useEffect(() => {
    setSearchDraft(urlSearch)
  }, [urlSearch])

  const replaceParams = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams.toString())
    mutate(next)
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  useEffect(() => {
    const raw = searchParams.get('tab')
    if (raw === 'mentors' || raw === 'mentees') return
    replaceParams((next) => {
      next.set('tab', 'mentors')
    })
  }, [searchParams, pathname, router])

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
    setGate({ status: 'loading' })
    void resolveSessionUser(claims).then(async (session) => {
      if (!session || !hasAdminRole(session.roles)) {
        setGate({ status: 'forbidden' })
        return
      }
      try {
        const profiles = await loadUserProfiles(session.userId)
        setGate({
          status: 'ready',
          profiles: {
            hasMentorProfile: profiles.hasMentorProfile,
            hasMenteeProfile: profiles.hasMenteeProfile,
          },
          roles: session.roles,
        })
      } catch {
        setGate({
          status: 'ready',
          profiles: { hasMentorProfile: false, hasMenteeProfile: false },
          roles: session.roles,
        })
      }
    })
  }, [claims])

  useEffect(() => {
    if (gate.status !== 'ready') return
    const cache = tab === 'mentors' ? mentorTab : menteeTab
    if (cache.status === 'ready' || cache.status === 'loading') return

    const setCache = tab === 'mentors' ? setMentorTab : setMenteeTab
    setCache({ status: 'loading' })
    void (async () => {
      try {
        const people = await loadIamPeople()
        if (tab === 'mentors') {
          const profiles = await listAllMentorProfiles()
          const rolePeople = peopleForRole(people, 'mentor')
          setMentorTab({
            status: 'ready',
            rows: joinMentorRows(rolePeople, profiles),
            loadedCount: rolePeople.length,
          })
          return
        }
        const profiles = await listAllMenteeProfiles()
        const rolePeople = peopleForRole(people, 'mentee')
        setMenteeTab({
          status: 'ready',
          rows: joinMenteeRows(rolePeople, profiles),
          loadedCount: rolePeople.length,
        })
      } catch {
        setCache({ status: 'failed' })
      }
    })()
  }, [gate.status, tab, loadTick])

  const cache = tab === 'mentors' ? mentorTab : menteeTab
  const result = useMemo(() => {
    if (cache.status !== 'ready') return null
    return applyPeopleQuery(cache.rows, cache.loadedCount, {
      tab,
      search: urlSearch,
      skill,
      interest,
      timezone,
      page,
      pageSize,
    })
  }, [cache, tab, urlSearch, skill, interest, timezone, page, pageSize])

  const chipOptions = cache.status === 'ready' ? peopleFilterChips(cache.rows) : []
  const timezoneOptions = cache.status === 'ready' ? peopleTimezoneOptions(cache.rows) : []
  const activeRow =
    cache.status === 'ready' && activeRowId
      ? cache.rows.find((row) => row.userId === activeRowId)
      : undefined

  const activeSetupTask = (() => {
    if (!activeRow || dialog !== 'setup') return undefined
    const stored = setupTasks.find((task) => task.userId === activeRow.userId)
    if (stored) return stored
    return {
      userId: activeRow.userId,
      email: activeRow.email,
      roles: ['mentor'],
      needsGrant: activeRow.needsSetup,
      needsProfile: !activeRow.mentorProfile,
      displayName: activeRow.displayName,
    }
  })()

  const closeDialog = () => {
    setDialog(null)
    setActiveRowId(undefined)
  }

  const handleTab = (nextTab: PeopleTab) => {
    replaceParams((next) => {
      next.set('tab', nextTab)
      next.delete('page')
      if (nextTab === 'mentors') next.delete('interest')
      else next.delete('skill')
    })
    closeDialog()
    setAddOpen(false)
  }

  const handleRetry = () => {
    if (tab === 'mentors') setMentorTab({ status: 'idle' })
    else setMenteeTab({ status: 'idle' })
    setLoadTick((tick) => tick + 1)
  }

  const handleClear = () => {
    setSearchDraft('')
    replaceParams((next) => {
      const keep = next.get('tab')
      Array.from(next.keys()).forEach((key) => next.delete(key))
      if (keep) next.set('tab', keep)
    })
  }

  const upsertMentorRow = (row: PeopleRow) => {
    setMentorTab((prev) => {
      if (prev.status !== 'ready') return prev
      const without = prev.rows.filter((item) => item.userId !== row.userId)
      return { ...prev, rows: [row, ...without], loadedCount: without.length + 1 }
    })
  }

  const handleAddMentor = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAddError(undefined)
    if (!addPassword.trim()) {
      setAddError(t('people.passwordRequired', 'Enter a temporary password.', 'admin'))
      return
    }
    setCreating(true)
    let userId = ''
    let roles = ['mentor']
    try {
      const created = await createMentorAccount({
        email: addEmail,
        displayName: addName,
        password: addPassword,
      })
      userId = created.userId
      try {
        await grantMentorRoleSafe(userId, roles)
      } catch (caught) {
        const task: SetupTask = {
          userId,
          email: addEmail.trim(),
          roles,
          needsGrant: true,
          needsProfile: true,
          displayName: addName.trim() || addEmail.trim(),
          error: readBlocksError(caught),
        }
        setSetupTasks((prev) => [...prev.filter((item) => item.userId !== userId), task])
        upsertMentorRow({
          userId,
          email: addEmail.trim(),
          displayName: addName.trim() || addEmail.trim(),
          tags: [],
          needsSetup: true,
        })
        setCreating(false)
        return
      }
      try {
        await saveMentorProfile(userId, {
          displayName: addName.trim() || addEmail.trim(),
          title: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        const profile = await fetchMentorProfile(userId)
        upsertMentorRow({
          userId,
          email: addEmail.trim(),
          displayName: addName.trim() || addEmail.trim(),
          timezone: profile?.timezone,
          tags: profile?.skills ?? [],
          needsSetup: false,
          profileItemId: profileItemId(profile),
          mentorProfile: profile,
        })
        setAddOpen(false)
        setAddEmail('')
        setAddName('')
        setAddPassword('')
        setBanner({
          kind: 'success',
          text: t('people.created', 'Mentor created.', 'admin'),
        })
      } catch (caught) {
        const task: SetupTask = {
          userId,
          email: addEmail.trim(),
          roles,
          needsGrant: false,
          needsProfile: true,
          displayName: addName.trim() || addEmail.trim(),
          error: readBlocksError(caught),
        }
        setSetupTasks((prev) => [...prev.filter((item) => item.userId !== userId), task])
        upsertMentorRow({
          userId,
          email: addEmail.trim(),
          displayName: addName.trim() || addEmail.trim(),
          tags: [],
          needsSetup: true,
        })
      }
    } catch (caught) {
      setAddError(readBlocksError(caught))
    } finally {
      setCreating(false)
    }
  }

  const handleRetryGrant = async (task: SetupTask) => {
    try {
      await grantMentorRoleSafe(task.userId, task.roles)
      setSetupTasks((prev) => {
        const next = prev
          .map((item) =>
            item.userId === task.userId ? { ...item, needsGrant: false, error: undefined } : item
          )
          .filter((item) => item.needsGrant || item.needsProfile)
        if (!next.some((item) => item.userId === task.userId && (item.needsGrant || item.needsProfile))) {
          closeDialog()
        }
        return next
      })
    } catch (caught) {
      setSetupTasks((prev) =>
        prev.map((item) =>
          item.userId === task.userId ? { ...item, error: readBlocksError(caught) } : item
        )
      )
    }
  }

  const handleRetryProfile = async (task: SetupTask) => {
    try {
      await saveMentorProfile(task.userId, {
        displayName: task.displayName,
        title: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      const profile = await fetchMentorProfile(task.userId)
      upsertMentorRow({
        userId: task.userId,
        email: task.email,
        displayName: task.displayName,
        timezone: profile?.timezone,
        tags: profile?.skills ?? [],
        needsSetup: false,
        profileItemId: profileItemId(profile),
        mentorProfile: profile,
      })
      setSetupTasks((prev) =>
        prev.filter((item) => item.userId !== task.userId || item.needsGrant)
      )
      closeDialog()
    } catch (caught) {
      setSetupTasks((prev) =>
        prev.map((item) =>
          item.userId === task.userId ? { ...item, error: readBlocksError(caught) } : item
        )
      )
    }
  }

  const shellProfiles =
    gate.status === 'ready'
      ? gate.profiles
      : { hasMentorProfile: false, hasMenteeProfile: false }
  const shellRoles = gate.status === 'ready' ? gate.roles : []
  const showLists = gate.status === 'ready'
  const unfilteredCount = cache.status === 'ready' ? cache.rows.length : 0
  const emptyTableMessage =
    unfilteredCount === 0
      ? tab === 'mentors'
        ? t('people.emptyMentors', 'No mentors yet.', 'admin')
        : t('people.emptyMentees', 'No mentees yet.', 'admin')
      : result?.totalCount === 0
        ? t('people.noMatches', 'No people match these filters.', 'admin')
        : ''

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
          <h1 className="mt-4 text-2xl font-semibold">{t('people.title', 'People', 'admin')}</h1>
        </div>

        {gate.status === 'forbidden' ? (
          <FlashBanner key="forbidden" kind="error">
            {t('people.forbidden', 'You need the admin role to manage people.', 'admin')}
          </FlashBanner>
        ) : null}

        {banner ? (
          <FlashBanner key={banner.text} kind={banner.kind}>
            {banner.text}
          </FlashBanner>
        ) : null}

        {gate.status === 'loading' ? <PeopleListSkeleton /> : null}

        {showLists ? (
          <>
            <div role="tablist" className="flex gap-2">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'mentors'}
                onClick={() => handleTab('mentors')}
                className={
                  tab === 'mentors'
                    ? 'rounded-md bg-[var(--color-brand)] px-3 py-2 text-sm font-medium text-white'
                    : 'rounded-md border border-[var(--color-border)] px-3 py-2 text-sm'
                }
              >
                {t('people.mentorsTab', 'Mentors', 'admin')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'mentees'}
                onClick={() => handleTab('mentees')}
                className={
                  tab === 'mentees'
                    ? 'rounded-md bg-[var(--color-brand)] px-3 py-2 text-sm font-medium text-white'
                    : 'rounded-md border border-[var(--color-border)] px-3 py-2 text-sm'
                }
              >
                {t('people.menteesTab', 'Mentees', 'admin')}
              </button>
            </div>

            {cache.status === 'failed' ? (
              <div className="space-y-3">
                <FlashBanner key="loadFailed" kind="error">
                  {t('people.loadFailed', 'Could not load people. Try again.', 'admin')}
                </FlashBanner>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="text-sm font-medium text-[var(--color-brand)] hover:underline"
                >
                  {t('people.retry', 'Retry', 'admin')}
                </button>
              </div>
            ) : null}

            {cache.status === 'loading' || cache.status === 'idle' ? <PeopleListSkeleton /> : null}

            {cache.status === 'ready' && result ? (
              <div className="space-y-4">
                {result.truncated ? (
                  <p className="text-sm text-[var(--color-text-muted)]" role="status">
                    {t(
                      'people.truncated',
                      'Showing the first 200 people in this role. Someone beyond that will not appear in search.',
                      'admin',
                    )}
                  </p>
                ) : null}
                <PeopleAdminTable
                  tab={tab}
                  result={result}
                  emptyMessage={emptyTableMessage}
                  tagOptions={chipOptions}
                  timezoneOptions={timezoneOptions}
                  tagFilter={tab === 'mentors' ? skill : interest}
                  timezoneFilter={timezone}
                  searchDraft={searchDraft}
                  pageSize={pageSize}
                  onSearchDraftChange={setSearchDraft}
                  onTagFilterChange={(value) =>
                    resetPageAndSet(tab === 'mentors' ? 'skill' : 'interest', value || null)
                  }
                  onTimezoneFilterChange={(value) => resetPageAndSet('timezone', value || null)}
                  onClearFilters={handleClear}
                  onPageChange={(nextPage) =>
                    replaceParams((next) => {
                      if (nextPage <= 1) next.delete('page')
                      else next.set('page', String(nextPage))
                    })
                  }
                  onPageSizeChange={(size) =>
                    replaceParams((next) => {
                      next.delete('page')
                      if (size === 20) next.delete('size')
                      else next.set('size', String(size))
                    })
                  }
                  onAddMentor={tab === 'mentors' ? () => setAddOpen(true) : undefined}
                  onSetupRow={(row) => {
                    setActiveRowId(row.userId)
                    setDialog('setup')
                  }}
                  onViewRow={(row) => {
                    setActiveRowId(row.userId)
                    setDialog('view')
                  }}
                />
              </div>
            ) : null}
          </>
        ) : null}

        <AppDialog
          open={addOpen && tab === 'mentors'}
          title={t('people.addMentor', 'Add mentor', 'admin')}
          closeLabel={t('people.close', 'Close', 'admin')}
          onClose={() => setAddOpen(false)}
        >
          <form onSubmit={handleAddMentor} className="space-y-4">
            {addError ? (
              <FlashBanner key={addError} kind="error">
                {addError}
              </FlashBanner>
            ) : null}
            <ProfileField label={t('people.email', 'Email', 'admin')}>
              <ProfileInput
                type="email"
                required
                autoComplete="off"
                value={addEmail}
                onChange={(event) => setAddEmail(event.target.value)}
              />
            </ProfileField>
            <ProfileField label={t('people.displayName', 'Display name', 'admin')}>
              <ProfileInput
                required
                dir="auto"
                value={addName}
                onChange={(event) => setAddName(event.target.value)}
              />
            </ProfileField>
            <ProfileField label={t('people.password', 'Temporary password', 'admin')}>
              <div className="flex gap-2">
                <ProfileInput
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={addPassword}
                  onChange={(event) => setAddPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((open) => !open)}
                  className="shrink-0 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  {showPassword
                    ? t('people.hidePassword', 'Hide password', 'admin')
                    : t('people.showPassword', 'Show password', 'admin')}
                </button>
              </div>
            </ProfileField>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {creating
                ? t('people.creating', 'Creating…', 'admin')
                : t('people.createMentor', 'Create mentor', 'admin')}
            </button>
          </form>
        </AppDialog>

        <AppDialog
          open={dialog === 'view' && Boolean(activeRow)}
          title={
            tab === 'mentors'
              ? t('people.viewMentor', 'Mentor details', 'admin')
              : t('people.viewMentee', 'Mentee details', 'admin')
          }
          closeLabel={t('people.close', 'Close', 'admin')}
          onClose={closeDialog}
        >
          {activeRow ? (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-[var(--color-text-muted)]">
                  {t('people.columnName', 'Name', 'admin')}
                </p>
                <p dir="auto">{activeRow.displayName}</p>
              </div>
              <div>
                <p className="font-medium text-[var(--color-text-muted)]">
                  {t('people.columnEmail', 'Email', 'admin')}
                </p>
                <p>{activeRow.email}</p>
              </div>
              <div>
                <p className="font-medium text-[var(--color-text-muted)]">
                  {t('people.timezone', 'Timezone', 'admin')}
                </p>
                <p>{activeRow.timezone ?? '—'}</p>
              </div>
              {tab === 'mentors' ? (
                <>
                  <div>
                    <p className="font-medium text-[var(--color-text-muted)]">
                      {t('field.title', 'Title', 'profile')}
                    </p>
                    <p dir="auto">{activeRow.mentorProfile?.title?.trim() || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-text-muted)]">
                      {t('people.skill', 'Skill', 'admin')}
                    </p>
                    {activeRow.tags.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {activeRow.tags.map((tag) => (
                          <span
                            key={`${activeRow.userId}-${tag}`}
                            dir="auto"
                            className="rounded-full bg-[var(--color-bg-inset)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[var(--color-text-muted)]">
                        {t('people.noProfile', 'No profile yet', 'admin')}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-medium text-[var(--color-text-muted)]">
                      {t('people.interest', 'Interest', 'admin')}
                    </p>
                    {activeRow.tags.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {activeRow.tags.map((tag) => (
                          <span
                            key={`${activeRow.userId}-${tag}`}
                            dir="auto"
                            className="rounded-full bg-[var(--color-bg-inset)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[var(--color-text-muted)]">
                        {t('people.noProfile', 'No profile yet', 'admin')}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-text-muted)]">
                      {t('people.goals', 'Goals', 'admin')}
                    </p>
                    {activeRow.menteeProfile?.goals?.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {activeRow.menteeProfile.goals.map((goal) => (
                          <span
                            key={`${activeRow.userId}-${goal}`}
                            dir="auto"
                            className="rounded-full bg-[var(--color-bg-inset)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]"
                          >
                            {goal}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[var(--color-text-muted)]">
                        {t('people.noProfile', 'No profile yet', 'admin')}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </AppDialog>

        <AppDialog
          open={dialog === 'setup' && Boolean(activeSetupTask)}
          title={t('people.completeSetup', 'Complete setup', 'admin')}
          closeLabel={t('people.close', 'Close', 'admin')}
          onClose={closeDialog}
        >
          {activeSetupTask ? (
            <div className="space-y-4 text-sm">
              <p dir="auto">
                {activeSetupTask.email} · {activeSetupTask.userId}
              </p>
              {activeSetupTask.error ? (
                <FlashBanner key={activeSetupTask.error} kind="error">
                  {activeSetupTask.error}
                </FlashBanner>
              ) : null}
              {activeSetupTask.needsGrant ? (
                <button
                  type="button"
                  onClick={() => void handleRetryGrant(activeSetupTask)}
                  className="text-sm font-medium text-[var(--color-brand)] hover:underline"
                >
                  {t('people.retryGrant', 'Grant mentor role', 'admin')}
                </button>
              ) : null}
              {activeSetupTask.needsProfile ? (
                <button
                  type="button"
                  onClick={() => void handleRetryProfile(activeSetupTask)}
                  className="text-sm font-medium text-[var(--color-brand)] hover:underline"
                >
                  {t('people.retryProfile', 'Create profile', 'admin')}
                </button>
              ) : null}
            </div>
          ) : null}
        </AppDialog>
      </Container>
    </AppShell>
  )
}

export default function AdminPeoplePage() {
  return (
    <RequireAuth>
      <RequireOnboardingComplete>
        <Suspense
          fallback={
            <AppShell>
              <Container variant="wide">
                <PeopleListSkeleton />
              </Container>
            </AppShell>
          }
        >
          <PeopleContent />
        </Suspense>
      </RequireOnboardingComplete>
    </RequireAuth>
  )
}
