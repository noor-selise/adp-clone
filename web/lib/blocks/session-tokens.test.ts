import assert from 'node:assert/strict'
import test from 'node:test'

const memoryStore = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

const expiredJwt = (): string => {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 120 })).toString(
    'base64url'
  )
  return `header.${payload}.sig`
}

const loadTokens = async () => {
  const storage = memoryStore()
  globalThis.sessionStorage = storage as unknown as Storage
  ;(globalThis as { window?: unknown }).window = globalThis
  const tokens = await import('./session-tokens.ts')
  tokens.clearLocalTokens()
  return { storage, tokens }
}

test('persistTokens writes the refresh token so a later reload can refresh', async () => {
  const { storage, tokens } = await loadTokens()
  tokens.persistTokens('access-token', 'refresh-token-value')
  assert.equal(storage.getItem('blocks-app:refresh-token'), 'refresh-token-value')
  assert.equal(tokens.getRefreshToken(), 'refresh-token-value')
})

test('persistTokens does not invent a refresh token when none is given', async () => {
  const { storage, tokens } = await loadTokens()
  tokens.persistTokens('access-only')
  assert.equal(storage.getItem('blocks-app:refresh-token'), null)
  assert.equal(tokens.getRefreshToken(), undefined)
})

test('forceRefreshAccessTokenFor returns undefined when no refresh token is stored', async () => {
  const { tokens } = await loadTokens()
  const refreshed = await tokens.forceRefreshAccessTokenFor(() => {
    throw new Error('client should not be used')
  })
  assert.equal(refreshed, undefined)
})

test('getValidAccessTokenFor refreshes when the access JWT is expired', async () => {
  const { tokens } = await loadTokens()
  tokens.persistTokens(expiredJwt(), 'refresh-token-value')

  const refreshed = await tokens.getValidAccessTokenFor(
    () =>
      ({
        auth: {
          oidc: {
            refreshToken: async () => ({
              access_token: 'fresh-access',
              refresh_token: 'fresh-refresh',
            }),
          },
          logout: async () => undefined,
        },
      }) as never
  )

  assert.equal(refreshed, 'fresh-access')
  assert.equal(tokens.getRefreshToken(), 'fresh-refresh')
})

test('a rejected refresh grant clears tokens and notifies session expired', async () => {
  const { storage, tokens } = await loadTokens()
  tokens.persistTokens(expiredJwt(), 'refresh-token-value')

  let expired = 0
  const stop = tokens.onSessionExpired(() => {
    expired += 1
  })

  const refreshed = await tokens.forceRefreshAccessTokenFor(
    () =>
      ({
        auth: {
          oidc: {
            refreshToken: async () => {
              throw new Error('invalid_grant')
            },
          },
          logout: async () => undefined,
        },
      }) as never
  )

  stop()
  assert.equal(refreshed, undefined)
  assert.equal(expired, 1)
  assert.equal(storage.getItem('blocks-app:refresh-token'), null)
  assert.equal(tokens.getRefreshToken(), undefined)
})
