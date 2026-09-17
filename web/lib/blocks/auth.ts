import { getBlocksClient } from './client'
import { blocksConfig } from './config'
import {
  clearLocalTokens,
  forceRefreshAccessTokenFor,
  getRefreshToken,
  getValidAccessTokenFor,
  onSessionExpired,
  persistTokens,
} from './session-tokens'

const RETURN_KEY = 'blocks-app:oidc-return-to'

export type CallbackResult =
  | { ok: true; returnTo: string }
  | { ok: false; message: string }

export type SessionClaims = Record<string, unknown>

export { onSessionExpired }

export const getValidAccessToken = (): Promise<string | undefined> =>
  getValidAccessTokenFor(getBlocksClient)

export const forceRefreshAccessToken = (): Promise<string | undefined> =>
  forceRefreshAccessTokenFor(getBlocksClient)

export const fetchSessionClaims = async (): Promise<SessionClaims | undefined> => {
  try {
    return await getBlocksClient().auth.userInfo()
  } catch {
    return undefined
  }
}

export const startLogin = async (returnTo?: string): Promise<void> => {
  if (!blocksConfig.oidcClientId) {
    throw new Error('Login is not configured. Set NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID.')
  }
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(RETURN_KEY, returnTo || '/dashboard')
  }
  await getBlocksClient().auth.idp.redirectToProvider()
}

export const completeLogin = async (callbackUrl: string): Promise<CallbackResult> => {
  const returnTo =
    (typeof window !== 'undefined' ? sessionStorage.getItem(RETURN_KEY) : null) || '/dashboard'
  if (typeof window !== 'undefined') sessionStorage.removeItem(RETURN_KEY)

  const data = await getBlocksClient().auth.idp.callback(callbackUrl)
  if (data.error) {
    return { ok: false, message: data.error_description || data.error }
  }

  const accessToken = data.access_token ?? data.accessToken
  if (accessToken) {
    persistTokens(accessToken, data.refresh_token ?? data.refreshToken)
  }
  return { ok: true, returnTo }
}

export const logout = async (): Promise<void> => {
  await getBlocksClient().auth.logout({ refreshToken: getRefreshToken() }).catch(() => undefined)
  clearLocalTokens()
}

export const getUserRoles = (claims?: SessionClaims): string[] => {
  if (!claims) return []
  const role = claims.role ?? claims.roles
  if (Array.isArray(role)) return role.map(String)
  if (typeof role === 'string') return [role]
  return []
}

export const hasRole = (claims: SessionClaims | undefined, slug: string): boolean =>
  getUserRoles(claims).includes(slug)
