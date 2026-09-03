import { Resend } from 'resend'

interface ContactRequest {
  name?: unknown
  email?: unknown
  message?: unknown
}

interface VercelResponse {
  status: (code: number) => VercelResponse
  json: (body: Record<string, string>) => void
}

const resend = new Resend(process.env.RESEND_API_KEY)
const recipient = process.env.CONTACT_TO_EMAIL || 'theglobalprojectleaders@gmail.com'

export default async function handler(request: Request, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  let body: ContactRequest
  try {
    body = await request.json() as ContactRequest
  } catch {
    response.status(400).json({ error: 'Invalid request body' })
    return
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!name || !email || !message || name.length > 100 || email.length > 254 || message.length > 5000) {
    response.status(400).json({ error: 'Please provide valid contact details and a message.' })
    return
  }

  try {
    await resend.emails.send({
      from: 'TGPL Website <onboarding@resend.dev>',
      to: recipient,
      replyTo: email,
      subject: `New website message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    })
    response.status(200).json({ message: 'Message sent' })
  } catch {
    response.status(500).json({ error: 'Unable to send message' })
  }
}