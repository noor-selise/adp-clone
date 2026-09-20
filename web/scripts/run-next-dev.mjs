import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LOOPBACK_BIND_HOST } from './local-bind-host.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const certDir = path.join(rootDir, '.cert')
const keyPath = path.join(certDir, 'dev-key.pem')
const certPath = path.join(certDir, 'dev-cert.pem')

const httpsPort = Number(process.env.BLOCKS_HTTPS_PORT ?? 443)
const nextBin = path.join(rootDir, 'node_modules/next/dist/bin/next')

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('Missing dev certificate. Run: npm run cert')
  process.exit(1)
}

// Bind loopback only. Passing the public hostname makes Next listen on the
// cloud A record (EADDRNOTAVAIL). The browser still uses the real domain via /etc/hosts.
const child = spawn(
  process.execPath,
  [
    nextBin,
    'dev',
    '--hostname',
    LOOPBACK_BIND_HOST,
    '--port',
    String(httpsPort),
    '--experimental-https',
    '--experimental-https-key',
    keyPath,
    '--experimental-https-cert',
    certPath,
  ],
  {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  }
)

child.on('exit', (code) => process.exit(code ?? 0))
