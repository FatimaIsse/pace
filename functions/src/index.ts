import * as functions from 'firebase-functions/v1'

// Firebase Auth's built-in emails (password reset, email verification) are
// controlled from the console (Authentication → Templates) — rebrand those
// there, not here. This function covers the one thing Firebase doesn't send
// on its own: a welcome email when someone actually creates an account.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'Pace <onboarding@resend.dev>'

function welcomeEmailHtml(name: string) {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1f2923;">
      <p style="font-size: 15px; font-weight: 600; letter-spacing: 0.02em; color: #48695a; margin: 0 0 24px;">Pace</p>
      <h1 style="font-size: 22px; margin: 0 0 12px;">Welcome to Pace, ${name}.</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #68726c; margin: 0 0 12px;">
        Pace is here to help you keep today doable — one small step at a time, without the
        overwhelm of seeing everything at once.
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #68726c; margin: 0;">
        Open Pace whenever you're ready to get started.
      </p>
    </div>
  `
}

export const sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  if (!user.email) return

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set — skipping welcome email.')
    return
  }

  const firstName = user.displayName?.split(' ')[0] ?? 'there'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Welcome to Pace',
      html: welcomeEmailHtml(firstName),
    }),
  })

  if (!res.ok) {
    console.error('Failed to send welcome email:', res.status, await res.text())
  }
})
