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
import { isSupportedLocale, DEFAULT_LOCALE } from './src/i18n/locales.js';
import type { LocaleCode } from './src/i18n/types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const isDev = process.env.NODE_ENV !== 'production';
const PUBLIC_DIR = resolve(__dirname, 'public');

function getPort(): number {
  const cliPortIndex = process.argv.findIndex(arg => arg === '--port');
  const cliPort = cliPortIndex >= 0 ? process.argv[cliPortIndex + 1] : undefined;
  const rawPort = cliPort ?? process.env.PORT ?? '5553';
  const port = Number.parseInt(rawPort, 10);
  return Number.isFinite(port) ? port : 5553;
}

// ─── SSR render ──────────────────────────────────────────────────────────────

async function renderUrl(url: string, headers: Record<string, string | string[] | undefined>): Promise<{ html: string; status: number }> {
  const requestUrl = new URL(url, 'http://localhost');
  const localeParam = requestUrl.searchParams.get('locale');

  const locale: LocaleCode = localeParam && isSupportedLocale(localeParam)
    ? localeParam
    : DEFAULT_LOCALE;

  // Root route → exact shell (pixel-perfect SSR from Stitch export) for all locales.
  if (requestUrl.pathname === '/') {
    const { renderExactShell } = await import('./src/entry-server.js');
    return renderExactShell(locale);
  }

  // All other routes → generic template-based SSR
  const { render } = await import('./src/entry-server.js');
  return render(url, locale, headers);
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
    "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
    "connect-src 'self' ws: wss: https:",
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
