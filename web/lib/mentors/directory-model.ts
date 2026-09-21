import type { MentorProfileRecord } from '@/lib/profiles'

export const DIRECTORY_PAGE_SIZE = 20

export type MentorDirectorySort = 'name' | 'skillMatch'

export type MentorDirectoryQuery = {
  search?: string
  skills?: string[]
  languages?: string[]
  timezone?: string
  sort?: MentorDirectorySort
  page?: number
}

export type MentorDirectoryPage = {
  items: MentorProfileRecord[]
  totalCount: number
  totalPages: number
  page: number
}

const normalize = (value: string | undefined): string => (value ?? '').trim().toLowerCase()

const displayNameOf = (mentor: MentorProfileRecord): string => mentor.displayName ?? ''

const compareNames = (left: MentorProfileRecord, right: MentorProfileRecord): number =>
  displayNameOf(left).localeCompare(displayNameOf(right), undefined, { sensitivity: 'base' })

const uniqueNormalized = (values: string[]): string[] => {
  const seen = new Map<string, string>()
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (!seen.has(key)) seen.set(key, trimmed)
  }
  return [...seen.values()].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: 'base' })
  )
}

const hasAnyMatch = (haystack: string[] | undefined, needles: string[]): boolean => {
  const set = new Set((haystack ?? []).map((value) => normalize(value)).filter(Boolean))
  return needles.some((needle) => set.has(normalize(needle)))
}

export const searchMentorsByName = (
  mentors: MentorProfileRecord[],
  search: string
): MentorProfileRecord[] => {
  const needle = normalize(search)
  if (!needle) return mentors
  return mentors.filter((mentor) => normalize(mentor.displayName).includes(needle))
}

export const filterMentorsBySkills = (
  mentors: MentorProfileRecord[],
  skills: string[]
): MentorProfileRecord[] => {
  const selected = skills.map((skill) => skill.trim()).filter(Boolean)
  if (!selected.length) return mentors
  return mentors.filter((mentor) => hasAnyMatch(mentor.skills, selected))
}

export const filterMentorsByLanguages = (
  mentors: MentorProfileRecord[],
  languages: string[]
): MentorProfileRecord[] => {
  const selected = languages.map((language) => language.trim()).filter(Boolean)
  if (!selected.length) return mentors
  return mentors.filter((mentor) => hasAnyMatch(mentor.languages, selected))
}

export const filterMentorsByTimezone = (
  mentors: MentorProfileRecord[],
  timezone: string
): MentorProfileRecord[] => {
  const wanted = timezone.trim()
  if (!wanted) return mentors
  return mentors.filter((mentor) => (mentor.timezone ?? '') === wanted)
}

export const sortMentorsByName = (mentors: MentorProfileRecord[]): MentorProfileRecord[] =>
  [...mentors].sort(compareNames)

const skillMatchScore = (mentor: MentorProfileRecord, menteeInterests: string[]): number => {
  const interests = new Set(menteeInterests.map((value) => normalize(value)).filter(Boolean))
  return (mentor.skills ?? []).filter((skill) => interests.has(normalize(skill))).length
}

export const sortMentorsBySkillMatch = (
  mentors: MentorProfileRecord[],
  menteeInterests: string[]
): MentorProfileRecord[] =>
  [...mentors].sort((left, right) => {
    const scoreDelta = skillMatchScore(right, menteeInterests) - skillMatchScore(left, menteeInterests)
    return scoreDelta !== 0 ? scoreDelta : compareNames(left, right)
  })

export const paginateMentors = (
  mentors: MentorProfileRecord[],
  page: number,
  pageSize = DIRECTORY_PAGE_SIZE
): MentorDirectoryPage => {
  const totalCount = mentors.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1)
  const requested = Number.isFinite(page) ? Math.trunc(page) : 1
  const clamped = Math.min(totalPages, Math.max(1, requested))
  const start = (clamped - 1) * pageSize
  return {
    items: mentors.slice(start, start + pageSize),
    totalCount,
    totalPages: totalCount === 0 ? 0 : totalPages,
    page: totalCount === 0 ? 1 : clamped,
  }
}

export const distinctSkills = (mentors: MentorProfileRecord[]): string[] =>
  uniqueNormalized(mentors.flatMap((mentor) => mentor.skills ?? []))

export const distinctLanguages = (mentors: MentorProfileRecord[]): string[] =>
  uniqueNormalized(mentors.flatMap((mentor) => mentor.languages ?? []))

export const distinctTimezones = (mentors: MentorProfileRecord[]): string[] =>
  uniqueNormalized(mentors.map((mentor) => mentor.timezone ?? ''))

export const applyMentorDirectoryQuery = (
  mentors: MentorProfileRecord[],
  menteeInterests: string[],
  query: MentorDirectoryQuery
): MentorDirectoryPage => {
  const searched = searchMentorsByName(mentors, query.search ?? '')
  const bySkills = filterMentorsBySkills(searched, query.skills ?? [])
  const byLanguages = filterMentorsByLanguages(bySkills, query.languages ?? [])
  const byTimezone = filterMentorsByTimezone(byLanguages, query.timezone ?? '')
  const sorted =
    query.sort === 'skillMatch'
      ? sortMentorsBySkillMatch(byTimezone, menteeInterests)
      : sortMentorsByName(byTimezone)
  return paginateMentors(sorted, query.page ?? 1)
}
