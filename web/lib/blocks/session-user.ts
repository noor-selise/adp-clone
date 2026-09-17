import { getBlocksClient } from '@/lib/blocks/client'
import { getUserRoles, type SessionClaims } from '@/lib/blocks/auth'

export type SessionUser = {
  userId: string
  roles: string[]
}

type IamMeRecord = {
  itemId?: string
  ItemId?: string
  roles?: string[]
}

const readIamMeRecord = (response: unknown): IamMeRecord | undefined => {
  if (!response || typeof response !== 'object') return undefined
  const record = response as { data?: IamMeRecord }
  return record.data
}

export const resolveSessionUser = async (
  claims?: SessionClaims
): Promise<SessionUser | undefined> => {
  try {
    const me = readIamMeRecord(await getBlocksClient().iam.me())
    const userId = me?.itemId ?? me?.ItemId
    if (userId) {
      return {
        userId,
        roles: me?.roles?.length ? me.roles : getUserRoles(claims),
      }
    }
  } catch {
    // Fall back to OIDC claims when IAM me is unavailable.
  }

  const fallbackId = typeof claims?.sub === 'string' ? claims.sub : undefined
  if (!fallbackId) return undefined

  return {
    userId: fallbackId,
    roles: getUserRoles(claims),
  }
}
