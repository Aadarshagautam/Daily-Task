import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const colors = {
  backend: '\x1b[36m',
  frontend: '\x1b[35m',
  reset: '\x1b[0m',
}

const services = [
  {
    name: 'backend',
    cwd: resolve(process.cwd(), 'backend'),
    packageJson: resolve(process.cwd(), 'backend', 'package.json'),
    args: ['run', 'dev'],
  },
  {
    name: 'frontend',
    cwd: resolve(process.cwd(), 'vite-project'),
    packageJson: resolve(process.cwd(), 'vite-project', 'package.json'),
    args: ['run', 'dev'],
  },
]

function getSpawnSpec(service) {
  if (process.platform === 'win32') {
    const command = process.env.ComSpec || 'cmd.exe'
    const joinedArgs = [npmCommand, ...service.args].join(' ')

    return {
      command,
      args: ['/d', '/s', '/c', joinedArgs],
    }
  }

  return {
    command: npmCommand,
    args: service.args,
  }
}

async function verifyServices() {
  for (const service of services) {
    const raw = await readFile(service.packageJson, 'utf8')
    const parsed = JSON.parse(raw)

    if (!parsed?.scripts?.dev) {
      throw new Error(`Missing "dev" script in ${service.packageJson}`)
    }
  }
}

function pipeOutput(stream, serviceName) {
  const reader = createInterface({ input: stream })
  const color = colors[serviceName] || ''

  reader.on('line', (line) => {
    console.log(`${color}[${serviceName}]${colors.reset} ${line}`)
  })

  return reader
}

function stopProcessTree(child) {
  if (!child || child.exitCode !== null || child.killed) return

  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' })
    return
  }

  child.kill('SIGTERM')
}

const checkOnly = process.argv.includes('--check')

await verifyServices()

if (checkOnly) {
  console.log('Root dev runner is ready:')
  services.forEach((service) => {
    console.log(`- ${service.name}: npm run dev (${service.cwd})`)
  })
  process.exit(0)
}

let shuttingDown = false

const children = services.map((service) => {
  const spawnSpec = getSpawnSpec(service)
  const child = spawn(spawnSpec.command, spawnSpec.args, {
    cwd: service.cwd,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  })

  pipeOutput(child.stdout, service.name)
  pipeOutput(child.stderr, service.name)

  child.on('error', (error) => {
    console.error(`[dev] Failed to start ${service.name}: ${error.message}`)
    shutdown(1)
  })

  return { ...service, child }
})

function shutdown(exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true

  children.forEach(({ child }) => stopProcessTree(child))

  setTimeout(() => {
    process.exit(exitCode)
  }, 150)
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => shutdown(0))
}

children.forEach(({ name, child }) => {
  child.on('exit', (code, signal) => {
    if (shuttingDown) return

    const detail = signal ? `signal ${signal}` : `code ${code ?? 0}`
    const exitCode = typeof code === 'number' ? code : 0

    console.error(`[dev] ${name} stopped with ${detail}. Shutting down the other dev server.`)
    shutdown(exitCode)
  })
})

console.log('[dev] Starting backend and frontend dev servers...')
