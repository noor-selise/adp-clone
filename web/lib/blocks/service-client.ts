import { createBlocksClient, type BlocksClient } from '@seliseblocks/client'
import { blocksConfig } from './config.ts'
import { isJwtExpired } from './jwt.ts'

const SERVICE_CLIENT_ID = process.env.BLOCKS_SERVICE_CLIENT_ID ?? ''
const SERVICE_CLIENT_SECRET = process.env.BLOCKS_SERVICE_CLIENT_SECRET ?? ''

let tokenClient: BlocksClient | null = null

const getTokenClient = (): BlocksClient => {
  if (!tokenClient) {
    tokenClient = createBlocksClient({
      apiUrl: blocksConfig.apiUrl,
      xBlocksKey: blocksConfig.xBlocksKey,
    })
  }
  return tokenClient
}

let cachedAccessToken: string | undefined
let refreshInFlight: Promise<string | undefined> | undefined

const fetchServiceAccessToken = async (): Promise<string | undefined> => {
  const response = await getTokenClient().auth.oidc.clientCredentials({
    clientId: SERVICE_CLIENT_ID,
    clientSecret: SERVICE_CLIENT_SECRET,
  })
  return response.access_token ?? response.accessToken
}

const getServiceAccessToken = async (): Promise<string | undefined> => {
  if (cachedAccessToken && !isJwtExpired(cachedAccessToken))
    return cachedAccessToken
  if (!refreshInFlight) {
    refreshInFlight = fetchServiceAccessToken()
      .then((token) => {
        cachedAccessToken = token
        return token
      })
      .finally(() => {
        refreshInFlight = undefined
      })
  }
  return refreshInFlight
}

const forceRefreshServiceAccessToken = async (): Promise<
  string | undefined
> => {
  cachedAccessToken = undefined
  return getServiceAccessToken()
}

let serviceClientInstance: BlocksClient | null = null

// Server only: this client authenticates via the M2M service credential
// (BLOCKS_SERVICE_CLIENT_ID/SECRET), never with an end user's own session.
export const getServiceBlocksClient = (): BlocksClient => {
  if (typeof window !== 'undefined') {
    throw new Error('Service Blocks client is not available in the browser')
  }
  if (!SERVICE_CLIENT_ID || !SERVICE_CLIENT_SECRET) {
    throw new Error(
      'Blocks service credential is not configured. Set BLOCKS_SERVICE_CLIENT_ID and BLOCKS_SERVICE_CLIENT_SECRET.',
    )
  }
  if (!serviceClientInstance) {
    serviceClientInstance = createBlocksClient({
      accessToken: getServiceAccessToken,
      apiUrl: blocksConfig.apiUrl,
      appDomain: blocksConfig.appDomain,
      onUnauthorized: forceRefreshServiceAccessToken,
      xBlocksKey: blocksConfig.xBlocksKey,
    })
  }
  return serviceClientInstance
}

// Test only: clears the cached client/token so a test can force a fresh client
// (e.g. after patching global fetch to simulate a notifier failure).
export const resetServiceBlocksClientForTest = (): void => {
  serviceClientInstance = null
  tokenClient = null
  cachedAccessToken = undefined
}
