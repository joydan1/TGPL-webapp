import {spawn} from 'node:child_process'

const port = 4173
const baseUrl = `http://127.0.0.1:${port}`
const npmCli = process.platform === 'win32'
  ? 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js'
  : null
const preview = npmCli
  ? spawn(process.execPath, [npmCli, 'run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  : spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

let output = ''
preview.stdout.on('data', (chunk) => { output += chunk.toString() })
preview.stderr.on('data', (chunk) => { output += chunk.toString() })

const stopPreview = () => {
  if (!preview.killed) preview.kill()
}

const waitForPreview = async () => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      await fetch(`${baseUrl}/`)
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }

  throw new Error(`Preview server did not start.\n${output}`)
}

const checks = [
  {path: '/', contentType: 'text/html', includes: '<div id="root">'},
  {path: '/login', contentType: 'text/html', includes: '<div id="root">'},
  {path: '/signup', contentType: 'text/html', includes: '<div id="root">'},
  {path: '/dashboard', contentType: 'text/html', includes: '<div id="root">'},
  {path: '/privacy', contentType: 'text/html', includes: '<div id="root">'},
  {path: '/terms', contentType: 'text/html', includes: '<div id="root">'},
  {path: '/robots.txt', contentType: 'text/plain', includes: 'User-agent: *'},
  {path: '/manifest.webmanifest', contentType: 'application/manifest+json', includes: 'The Global Project Leaders'},
  {path: '/pwa-192.png', contentType: 'image/png', includes: ''},
  {path: '/pwa-512.png', contentType: 'image/png', includes: ''},
  {path: '/sw.js', contentType: 'text/javascript', includes: 'tgpl-app-shell-v1'},
]

try {
  await waitForPreview()

  for (const check of checks) {
    const response = await fetch(`${baseUrl}${check.path}`)
    const body = await response.text()
    const contentType = response.headers.get('content-type') ?? ''

    if (!response.ok) throw new Error(`${check.path} returned HTTP ${response.status}`)
    if (!contentType.includes(check.contentType)) {
      throw new Error(`${check.path} returned unexpected content type: ${contentType}`)
    }
    if (!body.includes(check.includes)) {
      throw new Error(`${check.path} is missing expected content: ${check.includes}`)
    }

    console.log(`PASS ${check.path}`)
  }

  const indexResponse = await fetch(`${baseUrl}/`)
  const index = await indexResponse.text()
  if (index.includes('fonts.googleapis.com') || index.includes('js.paystack.co')) {
    throw new Error('The initial HTML still contains render-blocking third-party scripts or fonts')
  }

  console.log('PASS initial HTML has no render-blocking third-party resources')
  console.log('All smoke tests passed')
} finally {
  stopPreview()
}