import nodemailer from 'nodemailer';

export interface ContactFormPayload {
  name: string;
  email: string;
  message: string;
}

function getEnv(name: string): string {
  return process.env[name]?.trim() ?? '';
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

export async function sendContactEmail(payload: ContactFormPayload): Promise<void> {
  if (!hasContactMailConfig()) {
    throw new Error('Contact mail configuration missing');
  }

  const host = getEnv('MAIL_HOST');
  const port = Number.parseInt(getEnv('MAIL_PORT'), 10);
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
}
