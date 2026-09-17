import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const certDir = path.join(rootDir, '.cert')
const keyPath = path.join(certDir, 'dev-key.pem')
const certPath = path.join(certDir, 'dev-cert.pem')
const envPath = path.join(rootDir, '.env.local')

const readDevHost = () => {
  const fromEnv = process.env.NEXT_PUBLIC_BLOCKS_DEV_HOST?.trim()
  if (fromEnv) return fromEnv

  if (fs.existsSync(envPath)) {
    const match = fs.readFileSync(envPath, 'utf8').match(/^NEXT_PUBLIC_BLOCKS_DEV_HOST=(.+)$/m)
    if (match?.[1]) return match[1].trim()
  }

  throw new Error('Set NEXT_PUBLIC_BLOCKS_DEV_HOST in .env.local')
}

const devHost = readDevHost()
const httpsPort = Number(process.env.BLOCKS_HTTPS_PORT ?? 443)
const nextBin = path.join(rootDir, 'node_modules/next/dist/bin/next')

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('Missing dev certificate. Run: npm run cert')
  process.exit(1)
}

const child = spawn(
  process.execPath,
  [
    nextBin,
    'dev',
    '--hostname',
    devHost,
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
