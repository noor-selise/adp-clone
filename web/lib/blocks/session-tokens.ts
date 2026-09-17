import type { BlocksClient } from '@seliseblocks/client'
import { isJwtExpired } from './jwt'

const TOKEN_KEY = 'blocks-app:access-token'
const REFRESH_TOKEN_KEY = 'blocks-app:refresh-token'

let cachedAccessToken: string | undefined
let cachedRefreshToken: string | undefined
let refreshInFlight: Promise<string | undefined> | undefined

const sessionExpiredListeners = new Set<() => void>()

export const onSessionExpired = (listener: () => void): (() => void) => {
  sessionExpiredListeners.add(listener)
  return () => sessionExpiredListeners.delete(listener)
}

const notifySessionExpired = (): void => {
  for (const listener of sessionExpiredListeners) listener()
}

const getAccessToken = (): string | undefined => {
  if (cachedAccessToken && !isJwtExpired(cachedAccessToken)) return cachedAccessToken
  if (typeof window === 'undefined') return undefined

  const stored = sessionStorage.getItem(TOKEN_KEY)
  if (stored && !isJwtExpired(stored)) {
    cachedAccessToken = stored
    return stored
  }
  return undefined
}

export const getRefreshToken = (): string | undefined => {
  if (cachedRefreshToken) return cachedRefreshToken
  if (typeof window === 'undefined') return undefined
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) ?? undefined
}

export const persistTokens = (accessToken: string, refreshToken?: string): void => {
  cachedAccessToken = accessToken
  if (typeof window !== 'undefined') sessionStorage.setItem(TOKEN_KEY, accessToken)
  if (refreshToken) cachedRefreshToken = refreshToken
}

export const clearLocalTokens = (): void => {
  cachedAccessToken = undefined
  cachedRefreshToken = undefined
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

type ClientGetter = () => BlocksClient

const refreshAccessToken = async (
  getClient: ClientGetter,
  refreshToken: string
): Promise<string | undefined> => {
  try {
    const response = await getClient().auth.oidc.refreshToken({ refreshToken })
    const accessToken = response.access_token ?? response.accessToken
    if (!accessToken) {
      clearLocalTokens()
      await getClient().auth.logout({ refreshToken }).catch(() => undefined)
      notifySessionExpired()
      return undefined
    }
    const nextRefreshToken = response.refresh_token ?? response.refreshToken ?? refreshToken
    persistTokens(accessToken, nextRefreshToken)
    return accessToken
  } catch {
    return undefined
  }
}

export const getValidAccessTokenFor = async (getClient: ClientGetter): Promise<string | undefined> => {
  const current = getAccessToken()
  if (current) return current
  return forceRefreshAccessTokenFor(getClient)
}

export const forceRefreshAccessTokenFor = async (
  getClient: ClientGetter
): Promise<string | undefined> => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return undefined

  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken(getClient, refreshToken).finally(() => {
      refreshInFlight = undefined
    })
  }
  return refreshInFlight
}
