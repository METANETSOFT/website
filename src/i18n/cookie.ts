/**
 * Optional cookie-based locale persistence for SSR/edge environments.
 *
 * localStorage remains the primary client source (metanet.locale).
 * Cookie is an optional second channel for server/SSR bootstrap consistency.
 *
 * Usage:
 *   // On client: explicit dual-write (not automatic — preserves current behavior)
 *   i18n.setLocale('de');
 *   setLocaleCookie('de');
 *
 *   // On server: read cookie → pass to detectInitialLocale({ storedLocale: cookieValue })
 *   // See src/server/bootstrap-locale.ts
 *
 * Cookie is NOT read automatically by createI18n — only via detectInitialLocale on server.
 * This keeps localStorage as the single source of truth for client auto-detection.
 */

import type { LocaleCode } from './types';

export const LOCALE_COOKIE_NAME = 'metanet_locale';

// ── Cookie options ───────────────────────────────────────────────────────────

export interface CookieOptions {
  /** Cookie path. Default: '/' */
  path?: string;
  /** Max-age in seconds. Default: 31536000 (1 year) */
  maxAge?: number;
  /** SameSite attribute. Default: 'Lax' */
  sameSite?: 'Strict' | 'Lax' | 'None';
  /** Domain attribute. Default: unset (current host only) */
  domain?: string;
  /** Secure attribute. Default: auto-detect based on window.location.protocol */
  secure?: boolean;
}

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds
const DEFAULT_SAME_SITE = 'Lax';

// ── SSR guard ────────────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

/** Read the locale cookie value, or null if not set / SSR */
export function getLocaleCookie(): string | null {
  if (!isBrowser()) return null;
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, ...valParts] = cookie.trim().split('=');
      if (key === LOCALE_COOKIE_NAME) {
        return decodeURIComponent(valParts.join('='));
      }
    }
  } catch {
    // DOM access blocked — ignore
  }
  return null;
}

/** Write locale cookie. SSR-safe — no-op if not browser. */
export function setLocaleCookie(locale: LocaleCode, opts: CookieOptions = {}): void {
  if (!isBrowser()) return;
  try {
    const {
      path = '/',
      maxAge = DEFAULT_MAX_AGE,
      sameSite = DEFAULT_SAME_SITE,
      domain,
      secure,
    } = opts;

    const protocol = window.location.protocol ?? 'https:';
    const isSecure = secure ?? protocol === 'https:';

    let cookieStr = `${encodeURIComponent(LOCALE_COOKIE_NAME)}=${encodeURIComponent(locale)}`;
    cookieStr += `; Path=${path}`;
    cookieStr += `; Max-Age=${maxAge}`;
    cookieStr += `; SameSite=${sameSite}`;
    if (domain) cookieStr += `; Domain=${domain}`;
    if (isSecure) cookieStr += '; Secure';

    document.cookie = cookieStr;
  } catch {
    // DOM access blocked or cookie write failed — ignore silently
  }
}

/** Clear the locale cookie. SSR-safe. */
export function clearLocaleCookie(opts: CookieOptions = {}): void {
  setLocaleCookie('' as LocaleCode, { ...opts, maxAge: 0 });
}