import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const certDir = path.join(rootDir, '.cert')
const keyPath = path.join(certDir, 'dev-key.pem')
const certPath = path.join(certDir, 'dev-cert.pem')

const proxyPort = Number(process.env.BLOCKS_HTTPS_PORT ?? 443)
const targetPort = Number(process.env.BLOCKS_DEV_PORT ?? 3000)
const targetHost = '127.0.0.1'

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error('Missing dev certificate. Run: npm run cert')
  process.exit(1)
}

const proxyRequest = (req, res) => {
  const proxyReq = http.request(
    {
      hostname: targetHost,
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: req.headers.host ?? `127.0.0.1:${targetPort}`,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
      proxyRes.pipe(res)
    }
  )

  proxyReq.on('error', (error) => {
    console.error(`Proxy error: ${error.message}`)
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' })
    }
    res.end('Bad gateway — is Next.js running on port 3000? (npm run dev:app)')
  })

  req.pipe(proxyReq)
}

const server = https.createServer(
  {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  },
  proxyRequest
)

server.on('upgrade', (req, socket, head) => {
  const proxyReq = http.request({
    hostname: targetHost,
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: req.headers,
  })

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(
      `HTTP/1.1 ${proxyRes.statusCode ?? 101} ${proxyRes.statusMessage ?? 'Switching Protocols'}\r\n` +
        Object.entries(proxyRes.headers)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\r\n') +
        '\r\n\r\n'
    )
    proxySocket.write(proxyHead)
    proxySocket.pipe(socket)
    socket.pipe(proxySocket)
  })

  proxyReq.on('error', () => socket.destroy())
  proxyReq.end()
})

server.listen(proxyPort, '127.0.0.1', () => {
  console.log(`HTTPS proxy listening on https://127.0.0.1:${proxyPort} -> http://${targetHost}:${targetPort}`)
  console.log('Open the app at https://dpkhbr.slsblx.com (hosts file must map to 127.0.0.1)')
})

server.on('error', (error) => {
  if (error.code === 'EACCES' && proxyPort < 1024) {
    console.error(`Port ${proxyPort} requires elevated privileges. Run: sudo npm run dev:proxy`)
  } else {
    console.error(error.message)
  }
  process.exit(1)
})
