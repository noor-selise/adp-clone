export const blocksConfig = {
  apiUrl: process.env.NEXT_PUBLIC_BLOCKS_API_URL ?? '',
  appDomain: process.env.NEXT_PUBLIC_BLOCKS_APP_DOMAIN ?? '',
  oidcUrl: process.env.NEXT_PUBLIC_BLOCKS_OIDC_URL ?? '',
  oidcClientId: process.env.NEXT_PUBLIC_BLOCKS_OIDC_CLIENT_ID ?? '',
  oidcScope: process.env.NEXT_PUBLIC_BLOCKS_OIDC_SCOPE ?? 'openid profile',
  xBlocksKey: process.env.NEXT_PUBLIC_BLOCKS_PROJECT_KEY ?? '',
}

export const isBlocksConfigured = (): boolean =>
  Boolean(blocksConfig.apiUrl && blocksConfig.xBlocksKey && blocksConfig.appDomain)

export const isLoginConfigured = (): boolean =>
  Boolean(blocksConfig.apiUrl && blocksConfig.oidcUrl && blocksConfig.oidcClientId)
