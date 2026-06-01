import nodemailer from 'nodemailer';

export interface ContactFormPayload {
  name: string;
  email: string;
  message: string;
}

export type ContactMailErrorCode =
  | 'MAIL_CONFIG_MISSING'
  | 'MAIL_AUTH_FAILED'
  | 'MAIL_TLS_FAILED'
  | 'MAIL_TIMEOUT'
  | 'MAIL_UNREACHABLE'
  | 'MAIL_SEND_FAILED';

export class ContactMailError extends Error {
  code: ContactMailErrorCode;

  constructor(code: ContactMailErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ContactMailError';
    this.code = code;
  }
}

function normalizeEnvValue(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 2) return trimmed;

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === '"' || first === "'") && first === last) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function getEnv(name: string): string {
  return normalizeEnvValue(process.env[name] ?? '');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function hasContactMailConfig(): boolean {
  return [
    'MAIL_HOST',
    'MAIL_PORT',
    'MAIL_USERNAME',
    'MAIL_PASSWORD',
    'MAIL_FROM_ADDRESS',
  ].every((key) => getEnv(key).length > 0);
}

function toContactMailError(error: unknown): ContactMailError {
  if (error instanceof ContactMailError) return error;

  const err = error as NodeJS.ErrnoException & { code?: string; responseCode?: number; command?: string };
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown mail error');
  const lowerMessage = message.toLowerCase();
  const code = err?.code ?? '';

  if (
    code === 'EAUTH'
    || lowerMessage.includes('invalid login')
    || lowerMessage.includes('auth')
    || lowerMessage.includes('username and password not accepted')
  ) {
    return new ContactMailError(
      'MAIL_AUTH_FAILED',
      'Mail server authentication failed. Check MAIL_USERNAME and MAIL_PASSWORD.',
      { cause: error instanceof Error ? error : undefined },
    );
  }

  if (
    code === 'ESOCKET'
    || lowerMessage.includes('tls')
    || lowerMessage.includes('ssl')
    || lowerMessage.includes('certificate')
    || lowerMessage.includes('handshake')
    || lowerMessage.includes('wrong version number')
  ) {
    return new ContactMailError(
      'MAIL_TLS_FAILED',
      'Secure mail connection failed. Check MAIL_ENCRYPTION and TLS settings.',
      { cause: error instanceof Error ? error : undefined },
    );
  }

  if (
    code === 'ETIMEDOUT'
    || lowerMessage.includes('timeout')
  ) {
    return new ContactMailError(
      'MAIL_TIMEOUT',
      'Mail server timed out before completing transmission.',
      { cause: error instanceof Error ? error : undefined },
    );
  }

  if (
    code === 'ECONNREFUSED'
    || code === 'EHOSTUNREACH'
    || code === 'ENOTFOUND'
    || code === 'ECONNRESET'
  ) {
    return new ContactMailError(
      'MAIL_UNREACHABLE',
      'Mail server is unreachable. Check host, port, and network access.',
      { cause: error instanceof Error ? error : undefined },
    );
  }

  return new ContactMailError(
    'MAIL_SEND_FAILED',
    'Mail transmission failed unexpectedly.',
    { cause: error instanceof Error ? error : undefined },
  );
}

export function getContactMailErrorResponse(error: unknown): { code: ContactMailErrorCode; message: string; status: number } {
  const normalized = toContactMailError(error);

  switch (normalized.code) {
    case 'MAIL_CONFIG_MISSING':
      return { code: normalized.code, message: normalized.message, status: 503 };
    case 'MAIL_AUTH_FAILED':
    case 'MAIL_TLS_FAILED':
    case 'MAIL_SEND_FAILED':
      return { code: normalized.code, message: normalized.message, status: 502 };
    case 'MAIL_TIMEOUT':
      return { code: normalized.code, message: normalized.message, status: 504 };
    case 'MAIL_UNREACHABLE':
      return { code: normalized.code, message: normalized.message, status: 503 };
    default:
      return { code: 'MAIL_SEND_FAILED', message: 'Mail transmission failed unexpectedly.', status: 502 };
  }
}

export async function sendContactEmail(payload: ContactFormPayload): Promise<void> {
  if (!hasContactMailConfig()) {
    throw new ContactMailError('MAIL_CONFIG_MISSING', 'Mail service configuration is incomplete.');
  }

  const host = getEnv('MAIL_HOST');
  const port = Number.parseInt(getEnv('MAIL_PORT'), 10);
  if (!Number.isFinite(port) || port <= 0) {
    throw new ContactMailError('MAIL_CONFIG_MISSING', 'MAIL_PORT is missing or invalid.');
  }

  const encryption = (getEnv('MAIL_ENCRYPTION') || 'tls').toLowerCase();
  const secure = encryption === 'ssl' || port === 465;
  const rejectUnauthorized = (getEnv('MAIL_TLS_REJECT_UNAUTHORIZED') || 'true').toLowerCase() !== 'false';
  const fromAddress = getEnv('MAIL_FROM_ADDRESS');
  const fromName = getEnv('MAIL_FROM_NAME') || 'Metanetsoft';
  const toAddress = getEnv('CONTACT_TO_EMAIL') || fromAddress || 'info@metanetsoft.com';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    auth: {
      user: getEnv('MAIL_USERNAME'),
      pass: getEnv('MAIL_PASSWORD'),
    },
    requireTLS: encryption === 'tls',
    tls: {
      rejectUnauthorized,
    },
  });

  const safeName = escapeHtml(payload.name);
  const safeEmail = escapeHtml(payload.email);
  const safeMessage = escapeHtml(payload.message).replaceAll('\n', '<br />');

  try {
    await transporter.sendMail({
      from: `${fromName} <${fromAddress}>`,
      to: toAddress,
      replyTo: payload.email,
      subject: `Yeni Iletisim Formu | ${payload.name}`,
      text: [
        'Metanetsoft iletisim formu',
        '',
        `Ad Soyad: ${payload.name}`,
        `E-posta: ${payload.email}`,
        '',
        'Aciklama:',
        payload.message,
      ].join('\n'),
      html: `<!DOCTYPE html>
<html lang="tr">
  <body style="margin:0;padding:24px;background:#0e0e0e;color:#e5e5e5;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:640px;border-collapse:collapse;background:#17191b;border:1px solid #232628;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #232628;background:#0e0e0e;font-size:22px;line-height:28px;font-weight:800;letter-spacing:0.08em;color:#f4f7f8;">
          METANETSOFT
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <div style="margin-bottom:10px;font-size:12px;line-height:16px;font-weight:700;letter-spacing:0.14em;color:#8ff5ff;text-transform:uppercase;">Yeni iletisim talebi</div>
          <div style="margin-bottom:18px;font-size:16px;line-height:26px;font-weight:700;color:#f4f7f8;">Bize Ulasin formu dolduruldu.</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
            <tr>
              <td style="padding:0 0 8px;font-size:13px;line-height:20px;font-weight:700;color:#8ff5ff;">Ad Soyad</td>
            </tr>
            <tr>
              <td style="padding:0 0 18px;font-size:16px;line-height:26px;font-weight:600;color:#e5e5e5;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding:0 0 8px;font-size:13px;line-height:20px;font-weight:700;color:#8ff5ff;">E-posta</td>
            </tr>
            <tr>
              <td style="padding:0 0 18px;font-size:16px;line-height:26px;font-weight:600;color:#e5e5e5;">${safeEmail}</td>
            </tr>
            <tr>
              <td style="padding:0 0 8px;font-size:13px;line-height:20px;font-weight:700;color:#8ff5ff;">Aciklama</td>
            </tr>
            <tr>
              <td style="padding:0;font-size:16px;line-height:28px;font-weight:600;color:#e5e5e5;">${safeMessage}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    });
  } catch (error) {
    throw toContactMailError(error);
  }
}
