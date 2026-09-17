export type RegisterTrack = 'mentee' | 'mentor'

export const TRACK_STORAGE_KEY = 'mentormatch:register-track'

export const parseRegisterTrack = (
  value: string | null | undefined
): RegisterTrack | undefined => {
  if (value === 'mentee' || value === 'mentor') return value
  return undefined
}

export const persistRegisterTrack = (track: RegisterTrack): void => {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(TRACK_STORAGE_KEY, track)
}

export const readRegisterTrack = (): RegisterTrack | undefined => {
  if (typeof window === 'undefined') return undefined
  return parseRegisterTrack(sessionStorage.getItem(TRACK_STORAGE_KEY))
}

export const clearRegisterTrack = (): void => {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TRACK_STORAGE_KEY)
}

export const registerPath = (track: RegisterTrack): string => `/register?as=${track}`

export const onboardingPath = (track?: RegisterTrack): string =>
  track ? `/onboarding?as=${track}` : '/onboarding'
