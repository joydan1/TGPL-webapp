import {spawn} from 'node:child_process'

const port = 4173
const baseUrl = `http://127.0.0.1:${port}`
const preview = spawn('npm.cmd', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
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