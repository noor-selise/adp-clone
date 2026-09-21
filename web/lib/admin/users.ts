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

export const createIamMentor = async (input: {
  email: string
  displayName: string
  password: string
}): Promise<{ userId: string; email: string }> => {
  const names = input.displayName.trim().split(/\s+/)
  const firstName = names[0] || 'Mentor'
  const lastName = names.slice(1).join(' ') || firstName
  const created = (await getServiceBlocksClient().iam.users.create({
    email: input.email.trim(),
    password: input.password,
    firstName,
    lastName,
    roles: ['mentor'],
  })) as UsersListResponse & { data?: Record<string, unknown> }

  if (created.isSuccess === false) {
    throw new Error(readBlocksError(created))
  }

  const data = created.data
  const person = data && !Array.isArray(data) ? iamPersonFromRecord(data) : undefined
  const userId = person?.userId
  if (!userId) {
    throw new Error('Mentor account was created but no user id came back.')
  }
  return { userId, email: input.email.trim() }
}

export const grantMentorRole = async (userId: string, currentRoles: string[]): Promise<void> => {
  const roles = currentRoles.includes('mentor') ? currentRoles : [...currentRoles, 'mentor']
  const response = (await getServiceBlocksClient().iam.users.updateAccess({
    userId,
    roles,
  })) as UsersListResponse
  if (response.isSuccess === false) {
    throw new Error(readBlocksError(response))
  }
}
