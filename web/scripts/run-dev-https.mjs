import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { hostsFixHint, isLoopbackAddress, lookupHost } from './local-bind-host.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const certDir = path.join(rootDir, '.cert')
const freePortScript = path.join(rootDir, 'scripts/free-port.mjs')
const nextDevScript = path.join(rootDir, 'scripts/run-next-dev.mjs')
const hostsScript = path.join(rootDir, 'scripts/add-hosts-entry.sh')
const envPath = path.join(rootDir, '.env.local')

const readDevHost = () => {
  if (fs.existsSync(envPath)) {
    const match = fs.readFileSync(envPath, 'utf8').match(/^NEXT_PUBLIC_BLOCKS_DEV_HOST=(.+)$/m)
    if (match?.[1]) return match[1].trim()
  }
  return 'dpkhbr.slsblx.com'
}

if (!fs.existsSync(path.join(certDir, 'dev-cert.pem'))) {
  console.error('Run npm run cert first, then npm run hosts')
  process.exit(1)
}

const ensureHostsMapsToLoopback = async (devHost) => {
  let address = await lookupHost(devHost)
  if (isLoopbackAddress(address)) return

  console.log(`${devHost} currently resolves to ${address}. Adding a loopback hosts entry…`)
  const hostsResult = spawnSync('bash', [hostsScript], {
    cwd: rootDir,
    stdio: 'inherit',
  })
  if (hostsResult.status !== 0) {
    console.error(hostsFixHint(devHost))
    process.exit(hostsResult.status ?? 1)
  }

  address = await lookupHost(devHost)
  if (!isLoopbackAddress(address)) {
    console.error(
      `After updating hosts, ${devHost} still resolves to ${address}. ${hostsFixHint(devHost)}`
    )
    process.exit(1)
  }
}

for (const port of ['3000', '443']) {
  const result = spawnSync(process.execPath, [freePortScript, port], {
    cwd: rootDir,
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

const devHost = readDevHost()
await ensureHostsMapsToLoopback(devHost)

console.log('')
console.log(`Starting MentorMatch at https://${devHost}`)
console.log('Use that URL in the browser — not localhost.')
console.log('')

const child = spawn(process.execPath, [nextDevScript], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env,
})

const shutdown = () => {
  child.kill('SIGTERM')
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

child.on('exit', (code) => process.exit(code ?? 0))
