import { createBlocksClient, type BlocksClient } from '@seliseblocks/client'
import { forceRefreshAccessTokenFor, getValidAccessTokenFor } from './session-tokens'
import { blocksConfig } from './config'

let blocksClientInstance: BlocksClient | null = null

const getClientRef = (): BlocksClient => {
  if (!blocksClientInstance) {
    throw new Error('Blocks client is not initialized')
  }
  return blocksClientInstance
}

export const getBlocksClient = (): BlocksClient => {
  if (typeof window === 'undefined') {
    throw new Error('Blocks client is only available in the browser')
  }
  if (!blocksClientInstance) {
    blocksClientInstance = createBlocksClient({
      accessToken: () => getValidAccessTokenFor(getClientRef),
      apiUrl: blocksConfig.apiUrl,
      appDomain: blocksConfig.appDomain,
      onUnauthorized: () => forceRefreshAccessTokenFor(getClientRef),
      oidc: {
        clientId: blocksConfig.oidcClientId,
        scope: blocksConfig.oidcScope,
        url: blocksConfig.oidcUrl,
        redirectUri: `${window.location.origin}/login/callback`,
      },
      xBlocksKey: blocksConfig.xBlocksKey,
    })
  }
  return blocksClientInstance
}
