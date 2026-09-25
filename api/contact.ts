import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

interface ContactRequest {
  name?: unknown
  email?: unknown
  message?: unknown
}

const resend = new Resend(process.env.RESEND_API_KEY)
const recipient = process.env.CONTACT_TO_EMAIL || 'theglobalprojectleaders@gmail.com'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const body = (request.body ?? {}) as ContactRequest

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!name || !email || !message || name.length > 100 || email.length > 254 || message.length > 5000) {
    return response.status(400).json({ error: 'Please provide valid contact details and a message.' })
  }

  try {
    await resend.emails.send({
      from: 'TGPL Website <onboarding@resend.dev>',
      to: recipient,
      replyTo: email,
      subject: `New website message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    })
    return response.status(200).json({ message: 'Message sent' })
  } catch (error) {
    console.error('Resend send failed:', error)
    return response.status(500).json({ error: 'Unable to send message' })
  }
}