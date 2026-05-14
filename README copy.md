# Metanet i18n — Plain TypeScript Scaffold

Framework-agnostic. Zero deps. Works in browser, SSR, Node.

## Architecture

```
src/i18n/           Core i18n engine
  types.ts           LocaleCode, I18nInstance, TranslationDict types
  locales.ts         Supported locales, configs, country→locale map, isRTL
  storage.ts         localStorage read/write (SSR-safe)
  geo.ts             Client-side IP country resolution (calls /api/geo-country)
  detectLocale.ts    Detection priority: localStorage → IP → browser → en
  i18n.ts            createI18n() → init/getLocale/setLocale/t/subscribe/unsubscribe
  dictionaries/     Per-locale TranslationDict objects (30 locales; see Supported Locales)

src/server/          Server-side helpers
  http.ts            Request/Response types, getCountryFromRequest, getClientIP
  geo-country.ts     resolveCountry(req), buildGeoCountryResponse(), GeoProvider interface

src/ui/              Browser DOM helpers
  applyLocaleToDocument.ts  set document.documentElement.lang + dir
  createLanguageSwitcher.ts  build <select>, wire i18n, auto-sync, preferred ordering
  localeDisplay.ts    RECOMMENDED_VISIBLE_ORDER, getOrderedLocaleList, sortLocalesByRecommended
  bindTranslations.ts  scan [data-i18n] attributes, apply t(), subscribe updates
  index.ts           barrel

src/examples/
  geo-country-endpoint.ts  Framework adapter code + contract docs
  browser-demo.ts   init i18n → apply doc locale → mount switcher → bind elements
  index.html        Plain HTML usage example
```

## Install

Copy or link `src/` into your project. No npm install needed.

Or add as git submodule:

```bash
git submodule add <repo> src/i18n-lib
```

## Dokploy / Nixpacks

This project includes `nixpacks.toml` for Dokploy.

Default deployment flow:

```bash
npm ci
npm run build
npm run start
```

Notes:
- Production start runs with `NODE_ENV=production`
- App listens on `PORT` when Dokploy injects it
- Local fallback port remains `5553` when `PORT` is not set
- `tsx` is kept as a runtime dependency because production boot runs `server.ts` directly

Healthcheck endpoint:

```bash
GET /health
```

Example response:

```json
{ "status": "ok", "mode": "production" }
```

For Dokploy health checks, set path to:

```bash
/health
```

## Security Headers

Server sends these headers by default:

- `Content-Security-Policy`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Strict-Transport-Security` in production only

Notes:
- CSP allows current exact-shell dependencies: Tailwind CDN, Google Fonts, local assets, inline bootstrap/config scripts
- If you later remove Tailwind CDN or external fonts, CSP can be tightened further

## Quick Start

### 1. Backend: wire `/api/geo-country`

Your server must implement:

```
GET /api/geo-country
Response: { "countryCode": "DE" }   # ISO 3166-1 alpha-2 or null
```

See `src/examples/geo-country-endpoint.ts` for Express/Fastify/Hono adapters.

The endpoint reads country from trusted CDN/proxy headers:
`cf-ipcountry` → `x-vercel-ip-country` → `cloudfront-viewer-country` → `x-country-code`.

If no header present, return `{ "countryCode": null }`. Client falls back to browser language.

### 2. Client: init i18n

```typescript
import { createI18n } from './i18n/index';
import { applyLocaleToDocument } from './ui/applyLocaleToDocument';
import { createLanguageSwitcher } from './ui/createLanguageSwitcher';
import { bindTranslations } from './ui/bindTranslations';

// Plain auto-detect
const i18n = createI18n();
await i18n.init();

// Or seed from SSR bootstrap (skip IP detection round-trip)
const i18n = createI18n({ initialLocale: 'de', skipDetect: true });
await i18n.init();

// Apply lang + dir to <html>
applyLocaleToDocument(i18n.getLocale());
```

### 3. Mount language switcher

```typescript
// createLanguageSwitcher — plain <select> variant, simple and robust
const { select, cleanup } = createLanguageSwitcher({
  i18n,
  className: 'lang-switcher',
  groupByRegion: true,
  onChange: (locale) => applyLocaleToDocument(locale),
});
document.getElementById('lang-mount')?.appendChild(select);
// Call cleanup() on unmount to remove subscription listeners
```

```typescript
// createSearchableLanguageSwitcher — custom DOM combobox with search; better for 30 locales
// root is NOT auto-mounted — caller appends wherever needed
const { root, cleanup, open, close, focus } = createSearchableLanguageSwitcher({
  i18n,
  mount: document.getElementById('lang-switcher-mount'), // optional — only appends if provided
  preferredLocales: ['en', 'es', 'de', 'fr', 'ja'],
  groupByRegion: true,
  searchPlaceholder: 'Search language…', // falls back to i18n key
  className: 'lang-switcher',
  id: 'my-lang-switcher',
  onChange: (locale) => applyLocaleToDocument(locale),
});
// root is the container div; popover auto-opens on trigger click/key
// open/close/focus for manual control
// Call cleanup() on unmount
```

**Keyboard:** Enter/Space/ArrowDown on trigger opens; Escape closes; ArrowUp/Down/Enter from focused search input navigates and selects items.

**Accessibility:** Combobox pattern — input owns listbox via `aria-controls`, `aria-expanded`, `aria-activedescendant`. List items use `aria-selected`.

**No auto-mount:** If `mount` is omitted, root is returned unappended — caller decides placement. If `mount` is provided, root is appended on construction.

### 4. Bind DOM elements to translation keys

```html
<p data-i18n="home.welcome"></p>
<input type="text" data-i18n="contact.formName" data-i18n-attr="placeholder" />
<button data-i18n="common.save" data-i18n-attr="title">Save</button>
```

```typescript
const cleanup = bindTranslations(i18n);
// Returns cleanup fn — call on unmount
```

### 5. Translate imperatively

```typescript
const msg = i18n.t('contact.send');          // plain key
const greeting = i18n.t('home.welcome');      // dot-notation
const param = i18n.t('apply.title', { name: 'John' }); // {param} interpolation
```

## /api/geo-country Contract

**Request**: none required (country read from server headers)

**Response** (200 OK, `countryCode` is always present — `null` means detection failed):
```json
{ "countryCode": "DE" }
```
or
```json
{ "countryCode": null }
```

Status always 200. Never return 4xx for geo failures — client handles graceful fallback.

## Locale Persistence Rules

- **Auto-detection NEVER writes localStorage** — only `i18n.setLocale()` persists
- Priority on first visit: localStorage → IP country → browser → `en`
- Manual change: `i18n.setLocale('es')` → writes `metanet.locale` to localStorage
- Subsequent visits: localStorage override wins immediately

## Optional Cookie Sync for SSR / Edge

localStorage is the primary and always-wins client store for user locale.
A cookie (`metanet_locale`) is available as an optional second channel to pass the
user's choice to the server for SSR/edge bootstrap — enabling server-rendered pages
to render in the correct locale without a client round-trip.

**Dual-write (explicit — not automatic):**
```typescript
import { createI18n } from './i18n/index';
import { setLocaleCookie } from './i18n/index';

const i18n = createI18n();
await i18n.init();

// When user changes language, write both stores
i18n.setLocale('de');
setLocaleCookie('de');
```

**Server bootstrap (SSR / edge):**
```typescript
import { detectInitialLocale } from './server/bootstrap-locale';
import { getLocaleCookieFromHeader } from './server/cookies';
import { resolveCountry } from './server/geo-country';

export async function handleRequest(req) {
  // Parse cookie from raw HTTP header — not document.cookie (client-only)
  const cookieLocale = getLocaleCookieFromHeader(req.headers['cookie']);

  const { locale } = detectInitialLocale({
    storedLocale: cookieLocale, // checked first in detection priority
    countryCode: resolveCountry(req),
    acceptLanguage: req.headers['accept-language'],
  });

  // locale is pre-seeded — client init with { initialLocale: locale, skipDetect: true }
  return { locale };
}
```

**Why not automatic?**
Writing inside `setLocale()` would change current behavior and require cookie
domain/path configuration that varies by deployment. Explicit dual-write lets each
app decide when to sync.

**Cookie defaults:** `Path=/; Max-Age=31536000; SameSite=Lax` — override with
`setLocaleCookie(locale, { maxAge: ..., sameSite: 'Strict', path: '/app' })`.

## Supported Locales

**30 locales — two waves:**

| Wave | Locales |
|------|---------|
| Wave 1 (13) | `en` `es` `de` `fr` `ja` `zh-CN` `zh-TW` `pt-BR` `ko` `ar` `ru` `it` `id` |
| Wave 2 (17) | `hi` `ur` `tr` `vi` `pl` `nl` `ro` `cs` `sv` `hu` `uk` `th` `bn` `fa` `fil` `ms` `el` |

**RTL (3):** `ar` `ur` `fa` — `dir="rtl"` applied on `<html>` automatically.

**Locale fallback note:** Portugal currently falls back to `pt-BR` until a dedicated `pt-PT` locale is added.

**Recommended visible-first order** (used by `createLanguageSwitcher` by default):

```
en, es, de, fr, ja, zh-CN, zh-TW, pt-BR, ko,   ← popular/wave 1
ar, ru, it, id,                                  ← Europe + Middle East
hi, ur, tr, vi,                                  ← South / Central Asia
pl, nl, ro, cs, sv, hu, uk,                      ← Eastern Europe
th, bn, fa, fil, ms,                             ← Southeast / South Asia
el                                                ← Other
```

Use `RECOMMENDED_VISIBLE_ORDER` from `src/ui/localeDisplay.ts` or `getOrderedLocaleList()` for custom switcher UIs. For 30 locales in production, consider a searchable dropdown or grouped select — a plain `<select>` works but a combobox with search scales better. `createLanguageSwitcher({ groupByRegion: true })` enables grouped native-label rendering.

## Data-i18n Attribute Reference

| Attribute | Behaviour |
|---|---|
| `data-i18n="key"` | Set `textContent` to `t(key)` |
| `data-i18n-attr="placeholder\|aria-label\|title\|alt"` | Set specific attribute instead of textContent |
| `data-i18n-param-*="value"` | Interpolation: `data-i18n-param-name="John"` → `{name}` replaced |

## Run Commands

```bash
npm install
npm run dev        # development SSR server on http://localhost:3000
npm run build       # production build: client assets + SSR entry + server
npm run start      # serve production build on http://localhost:3000
npm run typecheck  # type-check both client and server TypeScript
```

## File Structure

```
metanet-i18n/
├── index.html              SSR HTML template with lang/dir/meta placeholders
├── vite.config.ts          Vite SSR build config
├── tsconfig.json          Client TypeScript config
├── tsconfig.server.json    Server TypeScript config
├── package.json            Scripts: dev, build, start, typecheck
├── server.ts               Root SSR server (dev: Vite middleware; prod: static + SSR)
├── src/
│   ├── entry-client.ts     Client bootstrap: reads SSR payload, creates i18n, binds UI
│   ├── entry-server.ts     SSR render: assembles page HTML with locale seed + schemas
│   ├── i18n/               Core i18n engine (unchanged)
│   ├── server/            Server helpers: bootstrap-locale, cookie, geo (unchanged)
│   └── ui/                DOM helpers: applyLocale, switcher, bind (unchanged)
└── public/
    ├── llms.txt           AI/crawler readable site summary
    ├── robots.txt         Crawl directives (allows general crawlers; blocks AI bots)
    └── sitemap.xml         Static sitemap placeholder
```

## SSR Principles

- **Server detects initial locale**: `detectInitialLocale({ storedLocale, countryCode, acceptLanguage })` from `src/server/bootstrap-locale.ts` — uses cookie (set by user choice) → CDN country header → Accept-Language header → `en` fallback
- **Bootstrap payload**: server injects `{ locale, skipDetect: true }` into `<script id="__i18n_bootstrap__">`
- **Client hydrates from same seed**: `createI18n({ initialLocale, skipDetect: true })` — no client-side detection round-trip
- **No client/server mismatch**: lang + dir set by server in HTML, client reads same locale from bootstrap
- **Locale change flow**: user picks locale → `i18n.setLocale()` writes localStorage + fires subscribers → `setLocaleCookie()` syncs cookie for next SSR request
- **Vary header**: `Accept-Language, Accept-Encoding, Cookie` set on all SSR responses for correct caching behavior
- **X-Robots-Tag**: `index, follow` on all SSR responses

## AI / Crawler Files

- `public/llms.txt` — human + AI readable site summary for LLMs.txt crawlers
- `public/robots.txt` — blocks GPTBot/ChatGPT-User/CCBot; allows all others; references sitemap
- `public/sitemap.xml` — static sitemap with section anchors; replace domain placeholder

## SSR / Non-Browser Guards

All browser-only code guarded by:
```typescript
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
```
Call `applyLocaleToDocument`, `createLanguageSwitcher`, `bindTranslations` only client-side.

## Path Notes

The scaffold lives at `/config/projects/metanet-i18n/` because the environment root `/projects/` is not writable. In your deployment, copy or symlink to your preferred path.

## Route Adapters (copy into your project)

Ready-to-use route handlers for common TypeScript frameworks. **Zero runtime deps in the scaffold** — all adapters use plain `Response` / `any` structural types with framework types as comments, so they copy without installing anything.

| File | Framework | Placement |
|---|---|---|
| `src/adapters/express-route.ts` | Express 4/5 | `app.get('/api/geo-country', ...)` |
| `src/adapters/fastify-route.ts` | Fastify 4/5 | `fastify.get('/api/geo-country', ...)` |
| `src/adapters/hono-route.ts` | Hono 4 (any runtime) | `app.get('/api/geo-country', ...)` |
| `src/adapters/next-app-route.ts` | Next.js App Router (14+) | `app/api/geo-country/route.ts` |

All four handlers call `resolveCountry(req)` and return `{ countryCode: string | null }` with status 200. The Next.js adapter uses the global `Response` constructor — no `next/server` import required (but `NextResponse.json()` is shown in comments).

Server-side locale bootstrap helper (`src/server/bootstrap-locale.ts`) provides `detectInitialLocale({ storedLocale, countryCode, acceptLanguage })` for SSR/edge rendering — use it to pre-set `lang` and `dir` on the server without a client round-trip.

## Stack-Specific Blocker

None in the scaffold itself. The only required integration is the `/api/geo-country` endpoint — everything else is pure TypeScript with no framework coupling. Wire the endpoint in Express, Fastify, Hono, Next.js, Remix, or plain Node http — the i18n layer does not care.
