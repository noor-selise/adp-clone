import { getBlocksClient } from '@/lib/blocks/client'
import type { ProfilePresence } from '@/lib/onboarding/gate'
import { applyRoleToProfilePresence } from '@/lib/onboarding/gate'
import { parseCollectionList, recordUserId } from '@/lib/profiles/collection'
import { isDuplicateProfileError } from '@/lib/profiles/errors'
import { defaultTimezone } from '@/lib/profiles/validation'

const MENTOR_SCHEMA = 'MentorProfile'
const MENTEE_SCHEMA = 'MenteeProfile'
const MENTOR_LIST_FIELD = 'getMentorProfiles'
const MENTEE_LIST_FIELD = 'getMenteeProfiles'

type RawProfileRecord = {
  itemId?: string
  ItemId?: string
}

export type MentorProfileRecord = RawProfileRecord & {
  userId?: string
  UserId?: string
  displayName?: string
  photoFileId?: string
  title?: string
  company?: string
  bio?: string
  skills?: string[]
  languages?: string[]
  timezone?: string
}

export type MenteeProfileRecord = RawProfileRecord & {
  userId?: string
  UserId?: string
  displayName?: string
  goals?: string[]
  interests?: string[]
  timezone?: string
}

export type UserProfiles = ProfilePresence & {
  mentor?: MentorProfileRecord
  mentee?: MenteeProfileRecord
}

export type MentorProfileInput = {
  userId: string
  displayName: string
  title: string
  timezone: string
}

export type MenteeProfileInput = {
  userId: string
  goals: string[]
  interests: string[]
  timezone: string
}

export type MentorProfileUpdate = Omit<MentorProfileRecord, 'itemId' | 'ItemId'>
export type MenteeProfileUpdate = Omit<MenteeProfileRecord, 'itemId' | 'ItemId'>

type MentorCreatePayload = MentorProfileRecord & { userId: string; companyVerificationStatus?: string }
type MenteeCreatePayload = MenteeProfileRecord & { userId: string }

const mentorCollection = () =>
  getBlocksClient().data.collection<MentorCreatePayload>(MENTOR_SCHEMA)

const menteeCollection = () =>
  getBlocksClient().data.collection<MenteeCreatePayload>(MENTEE_SCHEMA)

export const profileItemId = (record: RawProfileRecord | undefined): string | undefined =>
  record?.itemId ?? record?.ItemId

const normalizeRecord = <T extends RawProfileRecord>(record: T): T => {
  const itemId = profileItemId(record)
  return itemId ? { ...record, itemId, ItemId: itemId } : record
}

const userFilter = (userId: string) => ({ userId })

const findProfileForUser = async <T extends { userId?: string; UserId?: string }>(
  list: (options: {
    filter?: Record<string, string>
    pageNo: number
    pageSize: number
    fields: string[]
  }) => Promise<unknown>,
  fieldName: string,
  userId: string,
  fields: string[]
): Promise<T | undefined> => {
  const selection = ['userId', ...fields.filter((field) => field !== 'userId')]
  const matchForUser = (items: T[]) => items.find((record) => recordUserId(record) === userId)

  const filteredItems = parseCollectionList<T>(
    await list({ filter: userFilter(userId), pageNo: 1, pageSize: 5, fields: selection }),
    fieldName
  )
  const filtered = matchForUser(filteredItems)
  if (filtered) return filtered

  // ponytail: fallback when server-side filter shape is ignored; upgrade path is owner-scoped data rules + verified filter syntax
  const candidates = parseCollectionList<T>(
    await list({ pageNo: 1, pageSize: 100, fields: selection }),
    fieldName
  )
  return matchForUser(candidates)
}

export const fetchProfilePresence = async (userId: string): Promise<ProfilePresence> => {
  const [mentor, mentee] = await Promise.all([
    findProfileForUser<MentorProfileRecord>(
      (options) => mentorCollection().list(options),
      MENTOR_LIST_FIELD,
      userId,
      ['userId']
    ),
    findProfileForUser<MenteeProfileRecord>(
      (options) => menteeCollection().list(options),
      MENTEE_LIST_FIELD,
      userId,
      ['userId']
    ),
  ])

  return {
    hasMentorProfile: Boolean(mentor),
    hasMenteeProfile: Boolean(mentee),
  }
}

export const loadUserProfiles = async (userId: string): Promise<UserProfiles> => {
  const [mentor, mentee] = await Promise.all([
    findProfileForUser<MentorProfileRecord>(
      (options) => mentorCollection().list(options),
      MENTOR_LIST_FIELD,
      userId,
      ['displayName', 'photoFileId', 'title', 'company', 'bio', 'skills', 'languages', 'timezone']
    ),
    findProfileForUser<MenteeProfileRecord>(
      (options) => menteeCollection().list(options),
      MENTEE_LIST_FIELD,
      userId,
      ['displayName', 'goals', 'interests', 'timezone']
    ),
  ])

  return {
    hasMentorProfile: Boolean(mentor),
    hasMenteeProfile: Boolean(mentee),
    mentor: mentor ? normalizeRecord(mentor) : undefined,
    mentee: mentee ? normalizeRecord(mentee) : undefined,
  }
}

export const applyRoleToUserProfiles = (
  profiles: UserProfiles,
  roles: string[]
): UserProfiles => {
  const presence = applyRoleToProfilePresence(profiles, roles)
  return {
    ...presence,
    mentor: presence.hasMentorProfile ? profiles.mentor : undefined,
    mentee: presence.hasMenteeProfile ? profiles.mentee : undefined,
  }
}

export const fetchMentorProfile = async (userId: string): Promise<MentorProfileRecord | undefined> => {
  const profiles = await loadUserProfiles(userId)
  return profiles.mentor
}

export const fetchMenteeProfile = async (userId: string): Promise<MenteeProfileRecord | undefined> => {
  const profiles = await loadUserProfiles(userId)
  return profiles.mentee
}

export const createMentorProfile = async (input: MentorProfileInput): Promise<void> => {
  const existing = await findProfileForUser<MentorProfileRecord>(
    (options) => mentorCollection().list(options),
    MENTOR_LIST_FIELD,
    input.userId,
    ['userId']
  )
  if (existing) return

  try {
    await mentorCollection().create({
      userId: input.userId,
      displayName: input.displayName.trim(),
      title: input.title.trim(),
      timezone: input.timezone,
      companyVerificationStatus: 'unverified',
    })
  } catch (error) {
    if (isDuplicateProfileError(error)) return
    throw error
  }
}

export const createMenteeProfile = async (input: MenteeProfileInput): Promise<void> => {
  const existing = await findProfileForUser<MenteeProfileRecord>(
    (options) => menteeCollection().list(options),
    MENTEE_LIST_FIELD,
    input.userId,
    ['userId']
  )
  if (existing) return

  try {
    await menteeCollection().create({
      userId: input.userId,
      goals: input.goals,
      interests: input.interests,
      timezone: input.timezone,
    })
  } catch (error) {
    if (isDuplicateProfileError(error)) return
    throw error
  }
}

export const updateMentorProfile = async (
  itemId: string,
  profile: MentorProfileUpdate
): Promise<void> => {
  await mentorCollection().update(itemId, {
    displayName: profile.displayName?.trim(),
    photoFileId: profile.photoFileId || '',
    title: profile.title?.trim(),
    company: profile.company?.trim(),
    bio: profile.bio?.trim(),
    skills: profile.skills,
    languages: profile.languages,
    timezone: profile.timezone,
  })
}

export const updateMenteeProfile = async (
  itemId: string,
  profile: MenteeProfileUpdate
): Promise<void> => {
  await menteeCollection().update(itemId, {
    goals: profile.goals,
    interests: profile.interests,
    timezone: profile.timezone,
  })
}

export const saveMentorProfile = async (
  userId: string,
  profile: MentorProfileUpdate,
  itemId?: string
): Promise<void> => {
  if (itemId) {
    await updateMentorProfile(itemId, profile)
    return
  }

  await createMentorProfile({
    userId,
    displayName: profile.displayName?.trim() || 'Mentor',
    title: profile.title?.trim() || '',
    timezone: profile.timezone || defaultTimezone(),
  })
}

export const saveMenteeProfile = async (
  userId: string,
  profile: MenteeProfileUpdate,
  itemId?: string
): Promise<void> => {
  if (itemId) {
    await updateMenteeProfile(itemId, profile)
    return
  }

  await createMenteeProfile({
    userId,
    goals: profile.goals ?? [],
    interests: profile.interests ?? [],
    timezone: profile.timezone || defaultTimezone(),
  })
}

export { splitList, defaultTimezone, validateMentorProfile, validateMenteeProfile, mentorProfileCompleteness } from '@/lib/profiles/validation'
export { readBlocksError } from '@/lib/profiles/errors'
