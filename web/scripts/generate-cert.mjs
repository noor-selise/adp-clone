import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import selfsigned from 'selfsigned'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const certDir = path.join(rootDir, '.cert')

const readDevHost = () => {
  const cliDomain = process.argv[2]?.trim()
  if (cliDomain) return cliDomain

  const fromEnv = process.env.NEXT_PUBLIC_BLOCKS_DEV_HOST?.trim()
  if (fromEnv) return fromEnv

  const envPath = path.join(rootDir, '.env.local')
  if (fs.existsSync(envPath)) {
    const match = fs
      .readFileSync(envPath, 'utf8')
      .match(/^NEXT_PUBLIC_BLOCKS_DEV_HOST=(.+)$/m)
    if (match?.[1]) return match[1].trim()
  }

  throw new Error(
    'No domain given. Set NEXT_PUBLIC_BLOCKS_DEV_HOST in .env.local or run: npm run cert -- <domain>'
  )
}

const devHost = readDevHost()

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true })
}

const attrs = [{ name: 'commonName', value: devHost }]
const extensions = [
  {
    name: 'subjectAltName',
    altNames: [
      { type: 2, value: devHost },
      { type: 2, value: 'localhost' },
      { type: 7, ip: '127.0.0.1' },
    ],
  },
]

const pems = selfsigned.generate(attrs, {
  days: 825,
  keySize: 2048,
  extensions,
  algorithm: 'sha256',
})

fs.writeFileSync(path.join(certDir, 'dev-key.pem'), pems.private)
fs.writeFileSync(path.join(certDir, 'dev-cert.pem'), pems.cert)

console.log(`Generated dev certificate for ${devHost}`)
console.log(`  ${path.join(certDir, 'dev-cert.pem')}`)
console.log(`  ${path.join(certDir, 'dev-key.pem')}`)
console.log('')
console.log('Trust the certificate (Linux):')
console.log(
  `  sudo cp ${path.join(certDir, 'dev-cert.pem')} /usr/local/share/ca-certificates/blocks-dev.crt && sudo update-ca-certificates`
)
