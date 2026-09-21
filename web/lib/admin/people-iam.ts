import { getBlocksClient } from '@/lib/blocks/client'
import { createIamMentor, grantMentorRole, listIamPeople } from '@/lib/admin/users'
import {
  iamPeopleFromListResponse,
  iamPersonFromRecord,
  PEOPLE_LOAD_CAP,
  type IamPerson,
} from '@/lib/admin/people-model'

const personFromCreate = (response: { data?: unknown; isSuccess?: boolean }) => {
  if (response.isSuccess === false) return undefined
  const data = response.data
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined
  return iamPersonFromRecord(data as Record<string, unknown>)
}

export const loadIamPeople = async (): Promise<IamPerson[]> => {
  try {
    const response = await getBlocksClient().iam.users.list({
      pageNo: 1,
      pageSize: PEOPLE_LOAD_CAP,
    })
    const people = iamPeopleFromListResponse(response)
    if (people.length > 0) return people
  } catch {
    // Admin session list is preferred; service credential is the fallback in AC-14.
  }
  return listIamPeople()
}

export const createMentorAccount = async (input: {
  email: string
  displayName: string
  password: string
}): Promise<{ userId: string; email: string }> => {
  const names = input.displayName.trim().split(/\s+/)
  const firstName = names[0] || 'Mentor'
  const lastName = names.slice(1).join(' ') || firstName
  try {
    const created = await getBlocksClient().iam.users.create({
      email: input.email.trim(),
      password: input.password,
      firstName,
      lastName,
      roles: ['mentor'],
    })
    const person = personFromCreate(created)
    if (person?.userId) return { userId: person.userId, email: input.email.trim() }
  } catch {
    // User token create is preferred; service credential is the fallback in AC-14.
  }
  return createIamMentor(input)
}

export const grantMentorRoleSafe = async (userId: string, currentRoles: string[]): Promise<void> => {
  const roles = currentRoles.includes('mentor') ? currentRoles : [...currentRoles, 'mentor']
  try {
    const response = await getBlocksClient().iam.users.updateAccess({
      userId,
      roles,
    })
    if (response.isSuccess !== false) return
  } catch {
    // User token grant is preferred; service credential is the fallback in AC-14.
  }
  await grantMentorRole(userId, currentRoles)
}
