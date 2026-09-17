import { getBlocksClient } from './client'

export const MENTORMATCH_PERMISSIONS = {
  dashboard: 'mentormatch::ui::dashboard',
  profileSettings: 'mentormatch::ui::profile-settings',
  mentorSection: 'mentormatch::ui::mentor-section',
  menteeSection: 'mentormatch::ui::mentee-section',
  adminPanel: 'mentormatch::ui::admin-panel',
  readOwnMentor: 'mentormatch::profiles::read-own-mentor',
  writeOwnMentor: 'mentormatch::profiles::write-own-mentor',
  readOwnMentee: 'mentormatch::profiles::read-own-mentee',
  writeOwnMentee: 'mentormatch::profiles::write-own-mentee',
} as const

export type IamMe = {
  roles?: string[]
  permissions?: string[]
  email?: string
}

export const fetchIamMe = async (): Promise<IamMe | undefined> => {
  try {
    const response = (await getBlocksClient().iam.me()) as { data?: IamMe }
    return response.data
  } catch {
    return undefined
  }
}

export const hasPermission = (me: IamMe | undefined, permission: string): boolean =>
  Boolean(me?.permissions?.includes(permission))

export const hasRole = (me: IamMe | undefined, role: string): boolean =>
  Boolean(me?.roles?.includes(role))
