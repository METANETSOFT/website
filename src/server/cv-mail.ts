// Server-only: send a submitted CV to the pool inbox via SMTP (nodemailer).
// Reuses the legacy MAIL_* env contract. The Windmill cv_pipeline cron reads
// this inbox (user@metanetsoft.com) and processes CVs; multiple mails from the
// same sender address are expected and fine.
import nodemailer from 'nodemailer'

function env(name: string): string {
  const v = (process.env[name] ?? '').trim()
  if (v.length >= 2) {
    const a = v[0]
    const b = v[v.length - 1]
    if ((a === '"' || a === "'") && a === b) return v.slice(1, -1).trim()
  }
  return v
}

export function hasCvMailConfig(): boolean {
  return ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USERNAME', 'MAIL_PASSWORD', 'MAIL_FROM_ADDRESS'].every(
    (k) => env(k).length > 0,
  )
}

const MAX_CV_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export interface CvSubmission {
  fullName: string
  email: string
  note?: string
  fileName: string
  contentType: string
  bytes: Buffer
}

export async function sendCvEmail(sub: CvSubmission): Promise<void> {
  if (!hasCvMailConfig()) throw new Error('MAIL_CONFIG_MISSING')
  if (sub.bytes.length === 0 || sub.bytes.length > MAX_CV_BYTES) throw new Error('CV_FILE_INVALID')
  if (sub.contentType && !ALLOWED.has(sub.contentType)) throw new Error('CV_TYPE_INVALID')

  const port = Number.parseInt(env('MAIL_PORT'), 10)
  const encryption = (env('MAIL_ENCRYPTION') || 'tls').toLowerCase()
  const secure = encryption === 'ssl' || port === 465
  const fromAddress = env('MAIL_FROM_ADDRESS')
  const fromName = env('MAIL_FROM_NAME') || 'Metanetsoft'
  const toAddress = env('CV_TO_EMAIL') || 'user@metanetsoft.com'

  const transporter = nodemailer.createTransport({
    host: env('MAIL_HOST'),
    port,
    secure,
    auth: { user: env('MAIL_USERNAME'), pass: env('MAIL_PASSWORD') },
    requireTLS: encryption === 'tls',
    tls: { rejectUnauthorized: (env('MAIL_TLS_REJECT_UNAUTHORIZED') || 'true').toLowerCase() !== 'false' },
  })

  const esc = (s: string) =>
    s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const safeName = sub.fullName.trim() || '(unnamed)'
  await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to: toAddress,
    replyTo: sub.email,
    subject: `CV Havuzu — ${safeName}`,
    text: `Yeni CV gönderimi (metanetsoft.com havuz formu)\n\nAd: ${safeName}\nE-posta: ${sub.email}\nNot: ${sub.note ?? '-'}\n\nKVKK/GDPR açık rıza onayı verildi.`,
    html: `<p>Yeni CV gönderimi (metanetsoft.com havuz formu)</p><table>
<tr><td>Ad</td><td>${esc(safeName)}</td></tr>
<tr><td>E-posta</td><td>${esc(sub.email)}</td></tr>
<tr><td>Not</td><td>${esc(sub.note ?? '-')}</td></tr></table>
<p>KVKK/GDPR açık rıza onayı verildi.</p>`,
    attachments: [{ filename: sub.fileName || 'cv', content: sub.bytes, contentType: sub.contentType || 'application/octet-stream' }],
  })
}
