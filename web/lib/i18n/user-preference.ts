import { getValidAccessToken } from '@/lib/blocks/auth'
import { getBlocksClient } from '@/lib/blocks/client'
import { parseCollectionList, recordUserId } from '@/lib/profiles/collection'
import { isDuplicateProfileError } from '@/lib/profiles/errors'
import type { Locale } from './locale.ts'
import { ignorePreferenceSyncFailure } from './preference-sync.ts'

const SCHEMA = 'UserPreference'
const LIST_FIELD = 'getUserPreferences'

type UserPreferenceRecord = {
  itemId?: string
  ItemId?: string
  userId?: string
  UserId?: string
  preferredLocale?: Locale
}

const collection = () =>
  getBlocksClient().data.collection<UserPreferenceRecord & { userId: string; preferredLocale: Locale }>(SCHEMA)

const findForUser = async (userId: string): Promise<UserPreferenceRecord | undefined> => {
  const fields = ['userId', 'preferredLocale']
  const filtered = parseCollectionList<UserPreferenceRecord>(
    await collection().list({ filter: { userId }, pageNo: 1, pageSize: 5, fields }),
    LIST_FIELD
  )
  const match = filtered.find((record) => recordUserId(record) === userId)
  if (match) return match

  // ponytail: fallback when server-side filter shape is ignored, same convention as profiles.ts
  const all = parseCollectionList<UserPreferenceRecord>(
    await collection().list({ pageNo: 1, pageSize: 100, fields }),
    LIST_FIELD
  )
  return all.find((record) => recordUserId(record) === userId)
}

export const fetchAccountLocale = async (userId: string): Promise<Locale | undefined> =>
  ignorePreferenceSyncFailure(async () => {
    if (!(await getValidAccessToken())) return undefined
    const record = await findForUser(userId)
    return record?.preferredLocale
  })

export const upsertAccountLocale = async (userId: string, locale: Locale): Promise<void> => {
  await ignorePreferenceSyncFailure(async () => {
    if (!(await getValidAccessToken())) return
    const existing = await findForUser(userId)
    const itemId = existing?.itemId ?? existing?.ItemId
    if (itemId) {
      await collection().update(itemId, { preferredLocale: locale })
      return
    }

    try {
      await collection().create({ userId, preferredLocale: locale })
    } catch (error) {
      if (!isDuplicateProfileError(error)) throw error
      const created = await findForUser(userId)
      const createdId = created?.itemId ?? created?.ItemId
      if (createdId) await collection().update(createdId, { preferredLocale: locale })
    }
  })
}
