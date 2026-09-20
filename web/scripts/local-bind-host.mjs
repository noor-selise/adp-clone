import dns from 'node:dns/promises'

export const LOOPBACK_BIND_HOST = '127.0.0.1'

export const isLoopbackAddress = (address) =>
  address === '127.0.0.1' || address === '::1'

export const lookupHost = async (hostname) => {
  const { address } = await dns.lookup(hostname)
  return address
}

export const hostsFixHint = (hostname) =>
  `${hostname} resolves to a public IP, so Next.js cannot listen on it (EADDRNOTAVAIL). Map it in /etc/hosts with: npm run hosts — then open https://${hostname}, not localhost.`
