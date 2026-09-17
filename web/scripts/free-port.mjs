import { execSync } from 'node:child_process'

const port = Number(process.argv[2] ?? process.env.BLOCKS_DEV_PORT ?? 3000)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid port: ${port}`)
  process.exit(1)
}

const listPids = () => {
  const pids = new Set()

  // lsof only sees sockets it can read via /proc/<pid>/fd. It also matches
  // on remote port, so restrict to LISTEN to avoid flagging unrelated
  // outbound connections (e.g. a browser tab talking to some HTTPS server
  // on port 443) as "using" our dev port.
  try {
    const output = execSync(`lsof -ti :${port} -sTCP:LISTEN 2>/dev/null || true`, {
      encoding: 'utf8',
    }).trim()
    if (output) {
      for (const value of output.split('\n').map(Number)) {
        if (value) pids.add(value)
      }
    }
  } catch {
    // ignore
  }

  // A node process granted cap_net_bind_service (needed to bind <1024
  // without root) becomes non-dumpable, so /proc/<pid>/fd is unreadable
  // even to the same user and lsof can't see it. Fall back to matching
  // process argv (always readable) for anything that looks like it's
  // serving this exact port.
  try {
    const output = execSync(`ss -ltn 2>/dev/null | awk '{print $4}' | grep -E ':${port}$' || true`, {
      encoding: 'utf8',
    }).trim()
    if (output) {
      const psOutput = execSync('ps -eo pid=,args=', { encoding: 'utf8' })
      for (const line of psOutput.split('\n')) {
        const match = line.match(/^\s*(\d+)\s+(.*)$/)
        if (!match) continue
        const [, pidStr, args] = match
        if (args.includes(`--port ${port}`) || args.includes(`--port=${port}`)) {
          pids.add(Number(pidStr))
        }
      }
    }
  } catch {
    // ignore
  }

  return [...pids]
}

const isPortListening = () => {
  try {
    const output = execSync(`ss -ltn 2>/dev/null | awk '{print $4}' | grep -E ':${port}$' || true`, {
      encoding: 'utf8',
    }).trim()
    return output.length > 0
  } catch {
    return false
  }
}

const killPid = (pid, signal) => {
  try {
    process.kill(pid, signal)
    return true
  } catch {
    return false
  }
}

const pids = listPids()
if (pids.length === 0) {
  if (process.argv.includes('--verbose')) {
    console.log(`Port ${port} is already free`)
  }
  process.exit(0)
}

console.log(`Freeing port ${port} (PIDs: ${pids.join(', ')})`)

for (const pid of pids) {
  killPid(pid, 'SIGTERM')
}

execSync('sleep 0.5')

const remaining = listPids()
for (const pid of remaining) {
  killPid(pid, 'SIGKILL')
}

const stillBusy = listPids()
if (stillBusy.length > 0) {
  console.error(`Could not free port ${port}. Still in use by: ${stillBusy.join(', ')}`)
  process.exit(1)
}
if (isPortListening()) {
  console.error(`Could not free port ${port}. A process is still listening but its PID could not be identified.`)
  process.exit(1)
}

console.log(`Port ${port} is free`)
