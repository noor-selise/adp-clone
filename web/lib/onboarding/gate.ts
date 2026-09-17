import type { RegisterTrack } from './track'

export type ProfilePresence = {
  hasMentorProfile: boolean
  hasMenteeProfile: boolean
}

export type OnboardingGateInput = {
  roles: string[]
  profiles: ProfilePresence
  intendedTrack?: RegisterTrack
}

export const isAdminOnly = (roles: string[]): boolean =>
  roles.includes('admin') && !roles.includes('mentor') && !roles.includes('mentee')

export const needsOnboarding = (input: OnboardingGateInput): boolean => {
  const { roles, profiles, intendedTrack } = input

  if (isAdminOnly(roles)) return false

  if (intendedTrack === 'mentor' && !profiles.hasMentorProfile) return true
  if (intendedTrack === 'mentee' && !profiles.hasMenteeProfile) return true

  if (!profiles.hasMentorProfile && !profiles.hasMenteeProfile) return true

  return false
}

export const resolveOnboardingTrack = (
  roles: string[],
  profiles: ProfilePresence,
  storedTrack?: RegisterTrack,
  queryTrack?: RegisterTrack
): RegisterTrack | 'picker' | undefined => {
  const track = queryTrack ?? storedTrack
  if (track) {
    if (!canStartOnboardingTrack(track, roles)) return undefined
    if (track === 'mentor' && profiles.hasMentorProfile) return undefined
    if (track === 'mentee' && profiles.hasMenteeProfile) return undefined
    return track
  }

  if (profiles.hasMentorProfile || profiles.hasMenteeProfile) return undefined

  const hasMentorRole = roles.includes('mentor')
  const hasMenteeRole = roles.includes('mentee')

  if (hasMentorRole && !hasMenteeRole) return 'mentor'
  if (hasMenteeRole && !hasMentorRole) return 'mentee'

  return 'picker'
}

export const hasMentorRole = (roles: string[]): boolean => roles.includes('mentor')
export const hasMenteeRole = (roles: string[]): boolean => roles.includes('mentee')

/** Hide profile sections the IAM role cannot use, even if stray records exist in Data. */
export const applyRoleToProfilePresence = (
  profiles: ProfilePresence,
  roles: string[]
): ProfilePresence => ({
  hasMentorProfile: profiles.hasMentorProfile && hasMentorRole(roles),
  hasMenteeProfile: profiles.hasMenteeProfile && hasMenteeRole(roles),
})

export const dashboardSectionsFromProfiles = (
  profiles: ProfilePresence
): { showMentor: boolean; showMentee: boolean } => ({
  showMentor: profiles.hasMentorProfile,
  showMentee: profiles.hasMenteeProfile,
})

export const canStartOnboardingTrack = (track: RegisterTrack, roles: string[]): boolean => {
  if (track === 'mentor') return hasMentorRole(roles)
  if (track === 'mentee') return hasMenteeRole(roles)
  return false
}

const inferTrackFromRoles = (roles: string[]): RegisterTrack | undefined => {
  const hasMentorRole = roles.includes('mentor')
  const hasMenteeRole = roles.includes('mentee')
  if (hasMentorRole && !hasMenteeRole) return 'mentor'
  if (hasMenteeRole && !hasMentorRole) return 'mentee'
  return undefined
}

export const resolvePostAuthPath = (
  profiles: ProfilePresence,
  roles: string[],
  options?: {
    storedTrack?: RegisterTrack
    returnTo?: string
  }
): string => {
  const returnTo = options?.returnTo?.startsWith('/') ? options.returnTo : '/dashboard'

  if (needsOnboarding({ roles, profiles, intendedTrack: options?.storedTrack })) {
    const track = options?.storedTrack ?? inferTrackFromRoles(roles)
    return track ? `/onboarding?as=${track}` : '/onboarding'
  }

  return returnTo
}
