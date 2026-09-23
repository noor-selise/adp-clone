'use server'

import { getServiceBlocksClient } from '@/lib/blocks/service-client'
import { iamPeopleFromListResponse, iamPersonFromRecord, PEOPLE_LOAD_CAP, type IamPerson } from '@/lib/admin/people-model'
import { readBlocksError } from '@/lib/profiles/errors'

type UsersListResponse = {
  data?: unknown
  isSuccess?: boolean
  errors?: unknown
}

export const listIamPeople = async (): Promise<IamPerson[]> => {
  const response = (await getServiceBlocksClient().iam.users.list({
    pageNo: 1,
    pageSize: PEOPLE_LOAD_CAP,
  })) as UsersListResponse
  if (response.isSuccess === false) {
    throw new Error(readBlocksError(response))
  }
  return iamPeopleFromListResponse(response)
}

// A thrown error is never safe to let escape a 'use server' action: Next.js
// converts any uncaught exception into an opaque, message free 500 for the
// caller (redacted in production), no matter what the underlying failure
// was. Blocks failures (a duplicate email, a permission error, ...) are
// expected outcomes here, so they are caught and returned as data instead.
export type IamMentorOutcome =
  | { ok: true; userId: string; email: string }
  | { ok: false; message: string }

export const createIamMentor = async (input: {
  email: string
  displayName: string
  password: string
}): Promise<IamMentorOutcome> => {
  const names = input.displayName.trim().split(/\s+/)
  const firstName = names[0] || 'Mentor'
  const lastName = names.slice(1).join(' ') || firstName
  try {
    const created = (await getServiceBlocksClient().iam.users.create({
      email: input.email.trim(),
      password: input.password,
      firstName,
      lastName,
      roles: ['mentor'],
    })) as UsersListResponse & { data?: Record<string, unknown> }

    if (created.isSuccess === false) {
      return { ok: false, message: readBlocksError(created) }
    }

    const data = created.data
    const person = data && !Array.isArray(data) ? iamPersonFromRecord(data) : undefined
    const userId = person?.userId
    if (!userId) {
      return { ok: false, message: 'Mentor account was created but no user id came back.' }
    }
    return { ok: true, userId, email: input.email.trim() }
  } catch (caught) {
    return { ok: false, message: readBlocksError(caught) }
  }
}

export type GrantMentorRoleOutcome = { ok: true } | { ok: false; message: string }

export const grantMentorRole = async (
  userId: string,
  currentRoles: string[],
): Promise<GrantMentorRoleOutcome> => {
  const roles = currentRoles.includes('mentor') ? currentRoles : [...currentRoles, 'mentor']
  try {
    const response = (await getServiceBlocksClient().iam.users.updateAccess({
      userId,
      roles,
    })) as UsersListResponse
    if (response.isSuccess === false) {
      return { ok: false, message: readBlocksError(response) }
    }
    return { ok: true }
  } catch (caught) {
    return { ok: false, message: readBlocksError(caught) }
  }
}
