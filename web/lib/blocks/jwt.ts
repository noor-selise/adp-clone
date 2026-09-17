export const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const [, payload] = token.split('.')
  if (!payload) throw new Error('Invalid JWT: missing payload')

  const normalized = payload.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>
}

export const isJwtExpired = (token: string, skewMs = 30_000): boolean => {
  let expiry: number | undefined
  try {
    const payload = decodeJwtPayload(token)
    expiry = typeof payload.exp === 'number' ? payload.exp * 1000 : undefined
  } catch {
    return true
  }
  if (!expiry) return false
  return Date.now() + skewMs >= expiry
}
