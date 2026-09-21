import type { MentorProfileRecord, MenteeProfileRecord } from '../profiles.ts'
import { recordUserId } from '../profiles/collection.ts'
import { interestBadgeLabels, SKILL_CATALOG } from '../profiles/skill-catalog.ts'

export const PEOPLE_PAGE_SIZE = 20
export const PEOPLE_PAGE_SIZE_OPTIONS = [10, 20, 50] as const
export const PEOPLE_LOAD_CAP = 200

export type PeopleTab = 'mentors' | 'mentees'

export type IamPerson = {
  userId: string
  email: string
  roles: string[]
}

export type PeopleRow = {
  userId: string
  email: string
  displayName: string
  timezone?: string
  tags: string[]
  needsSetup: boolean
  profileItemId?: string
  mentorProfile?: MentorProfileRecord
  menteeProfile?: MenteeProfileRecord
}

export type PeopleQuery = {
  tab: PeopleTab
  search?: string
  skill?: string
  interest?: string
  timezone?: string
  page?: number
  pageSize?: number
}

export const parsePeoplePageSize = (value: string | null | undefined): number => {
  const parsed = Number(value ?? PEOPLE_PAGE_SIZE)
  return PEOPLE_PAGE_SIZE_OPTIONS.includes(parsed as (typeof PEOPLE_PAGE_SIZE_OPTIONS)[number])
    ? parsed
    : PEOPLE_PAGE_SIZE
}

export type PeoplePage = {
  items: PeopleRow[]
  totalCount: number
  totalPages: number
  page: number
  truncated: boolean
}

const profileItemId = (record: { itemId?: string; ItemId?: string } | undefined): string | undefined =>
  record?.itemId ?? record?.ItemId

const normalize = (value: string | undefined): string => (value ?? '').trim().toLowerCase()

export const parsePeopleTab = (value: string | null | undefined): PeopleTab =>
  value === 'mentees' ? 'mentees' : 'mentors'

const rolesFromRecord = (record: Record<string, unknown>): string[] => {
  const rawRoles = record.roles ?? record.Roles
  if (Array.isArray(rawRoles)) {
    return rawRoles.map((role) => String(role).trim()).filter(Boolean)
  }
  if (!rawRoles || typeof rawRoles !== 'object') return []
  return Object.values(rawRoles as Record<string, unknown>).flatMap((value) => {
    if (Array.isArray(value)) {
      return value.map((role) => String(role).trim()).filter(Boolean)
    }
    if (typeof value === 'string' && value.trim()) return [value.trim()]
    return []
  })
}

export const iamPersonFromRecord = (record: Record<string, unknown>): IamPerson | undefined => {
  const userId = String(record.itemId ?? record.ItemId ?? record.userId ?? record.UserId ?? '').trim()
  if (!userId) return undefined
  const email = String(record.email ?? record.Email ?? '').trim()
  return { userId, email, roles: rolesFromRecord(record) }
}

const listRows = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []
  const record = data as Record<string, unknown>
  if (Array.isArray(record.items)) return record.items
  if (Array.isArray(record.Items)) return record.Items
  if (Array.isArray(record.data)) return record.data
  return []
}

export const iamPeopleFromListResponse = (response: {
  data?: unknown
  isSuccess?: boolean
}): IamPerson[] => {
  if (response.isSuccess === false) return []
  return listRows(response.data)
    .map((row) =>
      row && typeof row === 'object' ? iamPersonFromRecord(row as Record<string, unknown>) : undefined
    )
    .filter((person): person is IamPerson => Boolean(person))
}

export const peopleForRole = (people: IamPerson[], role: 'mentor' | 'mentee'): IamPerson[] =>
  people.filter((person) => person.roles.includes(role)).slice(0, PEOPLE_LOAD_CAP)

export const joinMentorRows = (
  people: IamPerson[],
  profiles: MentorProfileRecord[]
): PeopleRow[] => {
  const byUser = new Map(
    profiles
      .map((profile) => {
        const userId = recordUserId(profile)
        return userId ? ([userId, profile] as const) : undefined
      })
      .filter((entry): entry is readonly [string, MentorProfileRecord] => Boolean(entry))
  )

  return people.map((person) => {
    const profile = byUser.get(person.userId)
    const displayName = profile?.displayName?.trim() || person.email || person.userId
    return {
      userId: person.userId,
      email: person.email,
      displayName,
      timezone: profile?.timezone?.trim() || undefined,
      tags: profile?.skills ?? [],
      needsSetup: !person.roles.includes('mentor') || !profile,
      profileItemId: profileItemId(profile),
      mentorProfile: profile,
    }
  })
}

export const joinMenteeRows = (
  people: IamPerson[],
  profiles: MenteeProfileRecord[]
): PeopleRow[] => {
  const byUser = new Map(
    profiles
      .map((profile) => {
        const userId = recordUserId(profile)
        return userId ? ([userId, profile] as const) : undefined
      })
      .filter((entry): entry is readonly [string, MenteeProfileRecord] => Boolean(entry))
  )

  return people.map((person) => {
    const profile = byUser.get(person.userId)
    const displayName = profile?.displayName?.trim() || person.email || person.userId
    return {
      userId: person.userId,
      email: person.email,
      displayName,
      timezone: profile?.timezone?.trim() || undefined,
      tags: profile?.interests ?? [],
      needsSetup: false,
      profileItemId: profileItemId(profile),
      menteeProfile: profile,
    }
  })
}

export const searchPeople = (rows: PeopleRow[], search: string): PeopleRow[] => {
  const needle = normalize(search)
  if (!needle) return rows
  return rows.filter(
    (row) =>
      normalize(row.displayName).includes(needle) || normalize(row.email).includes(needle)
  )
}

export const filterPeopleByTag = (rows: PeopleRow[], tag: string): PeopleRow[] => {
  const wanted = tag.trim()
  if (!wanted) return rows
  return rows.filter((row) => row.tags.includes(wanted))
}

export const filterPeopleByTimezone = (rows: PeopleRow[], timezone: string): PeopleRow[] => {
  const wanted = timezone.trim()
  if (!wanted) return rows
  return rows.filter((row) => (row.timezone ?? '') === wanted)
}

export const paginatePeople = (
  rows: PeopleRow[],
  page: number,
  pageSize = PEOPLE_PAGE_SIZE
): Omit<PeoplePage, 'truncated'> => {
  const totalCount = rows.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1)
  const requested = Number.isFinite(page) ? Math.trunc(page) : 1
  const clamped = Math.min(totalPages, Math.max(1, requested))
  const start = (clamped - 1) * pageSize
  return {
    items: rows.slice(start, start + pageSize),
    totalCount,
    totalPages: totalCount === 0 ? 0 : totalPages,
    page: totalCount === 0 ? 1 : clamped,
  }
}

export const applyPeopleQuery = (
  rows: PeopleRow[],
  loadedCount: number,
  query: PeopleQuery
): PeoplePage => {
  const tag = query.tab === 'mentors' ? query.skill ?? '' : query.interest ?? ''
  const searched = searchPeople(rows, query.search ?? '')
  const byTag = filterPeopleByTag(searched, tag)
  const byTimezone = filterPeopleByTimezone(byTag, query.timezone ?? '')
  return {
    ...paginatePeople(byTimezone, query.page ?? 1, query.pageSize ?? PEOPLE_PAGE_SIZE),
    truncated: loadedCount >= PEOPLE_LOAD_CAP,
  }
}

export const peopleFilterChips = (rows: PeopleRow[]): string[] =>
  interestBadgeLabels(
    SKILL_CATALOG,
    rows.flatMap((row) => row.tags)
  )

export const peopleTimezoneOptions = (rows: PeopleRow[]): string[] => {
  const seen = new Set<string>()
  const next: string[] = []
  for (const row of rows) {
    const timezone = row.timezone?.trim()
    if (!timezone || seen.has(timezone)) continue
    seen.add(timezone)
    next.push(timezone)
  }
  return next.sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }))
}
