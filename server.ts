/**
 * Root SSR server — plain TypeScript, no framework.
 *
 * Dev:   tsx watch server.ts   → Vite middleware + SSR rendering
 * Prod:  node dist/server.cjs   → serves built assets + SSR rendering
 *
 * SSR principles respected:
 *   - Server detects initial locale (cookie + country header + Accept-Language)
 *   - Bootstrap payload injected into HTML so client hydrates without mismatch
 *   - lang + dir set on <html> by server, client reads same seed (skipDetect: true)
 *   - Locale changes: localStorage write (via i18n.setLocale) + cookie via explicit callback
 */

import { createServer as createViteDevServer } from 'vite';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';
import { isSupportedLocale } from './src/i18n/locales.js';
import type { LocaleCode } from './src/i18n/types.js';
import { detectInitialLocale, getLocaleCookieFromHeader, resolveCountry } from './src/server/index.js';
import { getHeader, getClientIP } from './src/server/http.js';
import { sendContactEmail, hasContactMailConfig, getContactMailErrorResponse } from './src/server/contact-mail.js';
import { enqueueContactJob, getContactQueueJob, ContactQueueError } from './src/server/contact-queue.js';

loadEnv();

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';
const PUBLIC_DIR = resolve(__dirname, 'public');
const CLIENT_ENTRY_DEV = '/src/entry-client.ts';
const CLIENT_ENTRY_PROD = '/assets/entry-client.js';
const CONTACT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const CONTACT_RATE_LIMIT_MAX_REQUESTS = 5;
const contactRequestLog = new Map<string, number[]>();

// ─── PDF routes ─────────────────────────────────────────────────────────────
// Public document aliases — serve the local PDFs at clean, version-stable URLs.
const PDF_ROUTES: Record<string, { file: string; downloadName: string }> = {
  '/metanetsoft/cv': { file: 'metanetsoft/cv.pdf', downloadName: 'metanetsoft-cv.pdf' },
  '/metanetsoft/companyprofile': { file: 'metanetsoft/companyprofile.pdf', downloadName: 'metanetsoft-company-profile.pdf' },
};

function handlePdfRoute(
  url: string,
  res: { statusCode: number; setHeader(key: string, val: string): void; end(chunk?: Buffer | string): void },
): boolean {
  const pathname = url.split('?')[0];
  const route = PDF_ROUTES[pathname];
  if (!route) return false;

  const filePath = resolve(PUBLIC_DIR, route.file);
  // Guard against path traversal: route.file is hardcoded but stay defensive.
  if (!filePath.startsWith(PUBLIC_DIR) || !existsSync(filePath)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Not Found');
    return true;
  }

  try {
    const data = readFileSync(filePath);
    setCommonHeaders(res, url);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(data.byteLength));
    res.setHeader('Content-Disposition', `inline; filename="${route.downloadName}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.end(data);
    return true;
  } catch (err) {
    console.error('[pdf] failed to serve', pathname, err);
    res.statusCode = 500;
    res.end('Internal Server Error');
    return true;
  }
}

function getPort(): number {
  const cliPortIndex = process.argv.findIndex(arg => arg === '--port');
  const cliPort = cliPortIndex >= 0 ? process.argv[cliPortIndex + 1] : undefined;
  const rawPort = cliPort ?? process.env.PORT ?? '5553';
  const port = Number.parseInt(rawPort, 10);
  return Number.isFinite(port) ? port : 5553;
}

function sendJson(
  res: {
    statusCode: number;
    setHeader(key: string, val: string): void;
    end(body: string): void;
  },
  status: number,
  data: unknown,
): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function readRequestBody(req: { on(event: string, listener: (chunk?: Buffer) => void): void }): Promise<string> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk?: Buffer) => {
      if (chunk) chunks.push(chunk);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function isValidContactPayload(payload: unknown): payload is { name: string; email: string; message: string } {
  if (!payload || typeof payload !== 'object') return false;
  const { name, email, message } = payload as Record<string, unknown>;
  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string') return false;
  if (!name.trim() || !email.trim() || !message.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const recent = (contactRequestLog.get(clientKey) ?? []).filter((timestamp) => now - timestamp < CONTACT_RATE_LIMIT_WINDOW_MS);
  if (recent.length >= CONTACT_RATE_LIMIT_MAX_REQUESTS) {
    contactRequestLog.set(clientKey, recent);
    return true;
  }

  recent.push(now);
  contactRequestLog.set(clientKey, recent);
  return false;
}

async function handleContactRequest(
  req: { method?: string; headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string | undefined }; on(event: string, listener: (chunk?: Buffer) => void): void },
  res: { statusCode: number; setHeader(key: string, val: string): void; end(body: string): void },
  url: string,
): Promise<boolean> {
  const pathname = url.split('?')[0];
  if (pathname === '/api/contact-status') {
    setCommonHeaders(res, url);

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      sendJson(res, 405, { ok: false, error: 'Method Not Allowed', errorCode: 'METHOD_NOT_ALLOWED' });
      return true;
    }

    const requestUrl = new URL(url, 'http://localhost');
    const jobId = requestUrl.searchParams.get('jobId')?.trim() ?? '';
    if (!jobId) {
      sendJson(res, 400, { ok: false, error: 'Missing jobId', errorCode: 'INVALID_JOB_ID' });
      return true;
    }

    const job = getContactQueueJob(jobId);
    if (!job) {
      sendJson(res, 404, { ok: false, error: 'Queue job not found', errorCode: 'JOB_NOT_FOUND' });
      return true;
    }

    sendJson(res, 200, {
      ok: true,
      jobId: job.id,
      status: job.status,
      queuePosition: job.queuePosition,
      error: job.errorMessage,
      errorCode: job.errorCode,
    });
    return true;
  }

  if (pathname !== '/api/contact') return false;

  setCommonHeaders(res, url);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { ok: false, error: 'Method Not Allowed', errorCode: 'METHOD_NOT_ALLOWED' });
    return true;
  }

  if (!hasContactMailConfig()) {
    sendJson(res, 503, { ok: false, error: 'Mail service unavailable', errorCode: 'MAIL_CONFIG_MISSING' });
    return true;
  }

  const clientIp = getClientIP({ headers: req.headers, ip: req.socket?.remoteAddress });
  const rateLimitKey = clientIp || 'unknown';
  if (isRateLimited(rateLimitKey)) {
    res.setHeader('Retry-After', String(Math.ceil(CONTACT_RATE_LIMIT_WINDOW_MS / 1000)));
    sendJson(res, 429, { ok: false, error: 'Too Many Requests', errorCode: 'RATE_LIMITED' });
    return true;
  }

  try {
    const body = await readRequestBody(req);
    const payload = JSON.parse(body) as unknown;
    if (!isValidContactPayload(payload)) {
      sendJson(res, 400, { ok: false, error: 'Invalid payload', errorCode: 'INVALID_PAYLOAD' });
      return true;
    }

    const { jobId, queuePosition } = enqueueContactJob({
      name: payload.name.trim(),
      email: payload.email.trim(),
      message: payload.message.trim(),
    });

    console.log(`[contact] queued ip=${rateLimitKey} email=${payload.email.trim()} job=${jobId} position=${queuePosition}`);
    sendJson(res, 202, { ok: true, queued: true, jobId, queuePosition });
    return true;
  } catch (error) {
    if (error instanceof ContactQueueError) {
      console.error(`[contact] ${error.code}`, error);
      sendJson(res, 503, { ok: false, error: error.message, errorCode: error.code });
      return true;
    }

    const mailError = getContactMailErrorResponse(error);
    console.error(`[contact] ${mailError.code}`, error);
    sendJson(res, mailError.status, { ok: false, error: mailError.message, errorCode: mailError.code });
    return true;
  }
}

// ─── SSR render ──────────────────────────────────────────────────────────────

async function renderUrl(url: string, headers: Record<string, string | string[] | undefined>): Promise<{ html: string; status: number }> {
  const requestUrl = new URL(url, 'http://localhost');
  const locale = detectLocaleForRequest(requestUrl, headers);
  const clientEntryPath = isDev ? CLIENT_ENTRY_DEV : CLIENT_ENTRY_PROD;

  // Root route → exact shell (pixel-perfect SSR from Stitch export) for all locales.
  if (requestUrl.pathname === '/') {
    const { renderExactShell } = await import('./src/entry-server.js');
    return renderExactShell(locale, clientEntryPath);
  }

  // All other routes → generic template-based SSR
  const { render } = await import('./src/entry-server.js');
  return render(url, locale, headers, clientEntryPath);
}

function detectLocaleForRequest(
  requestUrl: URL,
  headers: Record<string, string | string[] | undefined>,
): LocaleCode {
  const localeParam = requestUrl.searchParams.get('locale');
  if (localeParam && isSupportedLocale(localeParam)) {
    return localeParam;
  }

  const cookieHeader = getHeader(headers, 'cookie');
  const acceptLanguage = getHeader(headers, 'accept-language');
  const storedLocale = getLocaleCookieFromHeader(cookieHeader);
  const countryCode = resolveCountry({ headers });

  return detectInitialLocale({
    storedLocale,
    countryCode,
    acceptLanguage,
  }).locale;
}

// ─── Dev server ───────────────────────────────────────────────────────────────

async function startDev(): Promise<void> {
  const vite = await createViteDevServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  const app = vite.middlewares;

  app.use(async (req, res) => {
    const url = req.url ?? '/';

    if (url === '/health') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ status: 'ok', mode: 'development' }));
      return;
    }

    if (await handleContactRequest(req, res, url)) {
      return;
    }

    if (handlePdfRoute(url, res)) {
      return;
    }

    // Skip asset requests — let Vite handle them
    if (url.startsWith('/assets') || url.startsWith('/src/') || url.includes('.')) {
      // noop — Vite dev server serves them via middlewares
      return;
    }

    try {
      const { html, status } = await renderUrl(url, req.headers as Record<string, string | string[] | undefined>);
      setCommonHeaders(res, url);
      res.statusCode = status;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err as Error);
      console.error('[ssr]', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const port = getPort();
  app.listen(port, () => {
    console.log(`[dev] SSR server listening on http://localhost:${port}`);
    console.log(`[dev] Vite dev server ready`);
  });
}

// ─── Prod server ──────────────────────────────────────────────────────────────

async function startProd(): Promise<void> {
  const distDir = resolve(__dirname, 'dist');

  const { createServer: createHttpServer } = await import('http');
  const server = createHttpServer(async (req, res) => {
    const url = req.url ?? '/';

    if (url === '/health') {
      setCommonHeaders(res, url);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ status: 'ok', mode: 'production' }));
      return;
    }

    if (await handleContactRequest(req, res, url)) {
      return;
    }

    if (handlePdfRoute(url, res)) {
      return;
    }

    const publicPath = resolvePublicFile(url);
    if (publicPath) {
      try {
        const data = readFileSync(publicPath);
        const ext = publicPath.split('.').pop() ?? '';
        setCommonHeaders(res, url);
        res.setHeader('Content-Type', mimeTypeForExt(ext));
        res.end(data);
      } catch {
        res.statusCode = 404;
        res.end('Not Found');
      }
      return;
    }

    // Static assets from dist/assets/
    if (url.startsWith('/assets/')) {
      const filePath = join(distDir, url);
      try {
        const data = readFileSync(filePath);
        const ext = filePath.split('.').pop() ?? '';
        const mimeType = mimeTypeForExt(ext);
        setCommonHeaders(res, url);
        res.setHeader('Content-Type', mimeType);
        res.end(data);
      } catch {
        res.statusCode = 404;
        res.end('Not Found');
      }
      return;
    }

    // API / internal routes — not SSR
    if (url.startsWith('/api/')) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    try {
      const { html, status } = await renderUrl(url, req.headers as Record<string, string | string[] | undefined>);
      setCommonHeaders(res, url);
      res.statusCode = status;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(html);
    } catch (err) {
      console.error('[ssr]', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const port = getPort();
  server.listen(port, () => {
    console.log(`[prod] SSR server listening on http://localhost:${port}`);
  });
}

function resolvePublicFile(url: string): string | null {
  const cleanUrl = url.split('?')[0].split('#')[0];
  if (!cleanUrl || cleanUrl === '/' || cleanUrl.startsWith('/api/')) return null;

  const filePath = resolve(PUBLIC_DIR, `.${cleanUrl}`);
  if (!filePath.startsWith(PUBLIC_DIR)) return null;
  if (!existsSync(filePath)) return null;
  if (!statSync(filePath).isFile()) return null;
  return filePath;
}

// ─── Common headers ───────────────────────────────────────────────────────────

function setCommonHeaders(res: { setHeader(key: string, val: string): void }, url: string): void {
  // Vary: Accept-Language is critical for locale-dependent caching
  res.setHeader('Vary', 'Accept-Language, Accept-Encoding, Cookie');

  // Crawl / bot headers
  res.setHeader('X-Robots-Tag', 'index, follow');

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://static.cloudflareinsights.com",
    "connect-src 'self' ws: wss: https: https://cloudflareinsights.com https://static.cloudflareinsights.com",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

function mimeTypeForExt(ext: string): string {
  const map: Record<string, string> = {
    js: 'application/javascript',
    mjs: 'application/javascript',
    css: 'text/css',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    ico: 'image/x-icon',
    json: 'application/json',
    html: 'text/html',
    txt: 'text/plain',
    xml: 'application/xml',
  };
  return map[ext] ?? 'application/octet-stream';
}

// ─── Bootstrap ─────────────────────────────────────────────────────────────────

const mode = process.env.NODE_ENV ?? (isDev ? 'development' : 'production');
console.log(`[server] Starting in ${mode} mode`);

if (isDev) {
  startDev();
} else {
  startProd();
}
