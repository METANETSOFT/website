/**
 * Server-side cookie parsing helpers.
 * Pure functions — no browser APIs, no side effects, no external calls.
 *
 * These operate on raw HTTP Cookie headers (e.g. from Express, Fastify, Hono, Next.js).
 * For client-side cookie reading, use getLocaleCookie() from /i18n/cookie instead.
 *
 * Cookie name note: matches /i18n/cookie LOCALE_COOKIE_NAME = 'metanet_locale'.
 * Inlined here to keep server/ independent from i18n/ — copy the name if needed.
 */

const LOCALE_COOKIE = 'metanet_locale';

/** Parse a raw Cookie header into a key→value map. Returns {} if null/undefined. */
export function parseCookieHeader(cookieHeader: string | null | undefined): Record<string, string> {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};

  const result: Record<string, string> = {};
  const pairs = cookieHeader.split(';');

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.trim().split('=');
    if (!key) continue;
    const decodedKey = decodeURIComponent(key.trim());
    const decodedValue = decodeURIComponent(valueParts.join('='));
    result[decodedKey] = decodedValue;
  }

  return result;
}

/** Get a single cookie value by name from a raw Cookie header. Returns null if not found. */
export function getCookie(cookieHeader: string | null | undefined, name: string): string | null {
  const cookies = parseCookieHeader(cookieHeader);
  const val = cookies[name];
  return val ?? null;
}

/** Read the locale cookie from a raw Cookie header string. Returns null if absent or SSR context. */
export function getLocaleCookieFromHeader(
  cookieHeader: string | null | undefined,
  cookieName: string = LOCALE_COOKIE,
): string | null {
  return getCookie(cookieHeader, cookieName);
}