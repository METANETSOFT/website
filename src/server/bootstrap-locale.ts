/**
 * Server-side initial locale detection.
 * Pure functions — no browser APIs, no side effects, no external calls.
 *
 * Input sources (all from server request):
 *   storedLocale   — value from cookie/header set by previous setLocale() call
 *   countryCode    — resolved from CDN/proxy headers (cf-ipcountry, etc.)
 *   acceptLanguage — raw Accept-Language request header
 *
 * Priority (mirrors client-side detectLocale):
 *   storedLocale → countryCode → acceptLanguage → 'en'
 *
 * Re-uses SUPPORTED_LOCALES and DEFAULT_LOCALE from /i18n/locales
 * so the list is defined once and stays in sync.
 */

import { parseAcceptLanguage, normalizeAcceptLanguage } from './respond';
import { COUNTRY_TO_LOCALE, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../i18n/locales';
import type { LocaleCode } from '../i18n/types';

/** Map a country code to a supported locale. Returns null if no mapping. */
export function localeFromCountry(countryCode: string): LocaleCode | null {
  return COUNTRY_TO_LOCALE[countryCode.toUpperCase()] ?? null;
}

export interface DetectInitialLocaleOptions {
  /** Value from cookie/header set by previous i18n.setLocale() — highest priority */
  storedLocale?: string | null;
  /** Country code resolved from CDN/proxy headers (cf-ipcountry, x-vercel-ip-country, etc.) */
  countryCode?: string | null;
  /** Raw Accept-Language header from HTTP request */
  acceptLanguage?: string | null;
}

export interface DetectResult {
  locale: LocaleCode;
  source: 'stored' | 'country' | 'browser' | 'default';
  countryCode: string | null;
}

/**
 * Determine the initial locale for a request.
 * Pure function — no I/O, no side effects.
 */
export function detectInitialLocale(opts: DetectInitialLocaleOptions = {}): DetectResult {
  const {
    storedLocale = null,
    countryCode = null,
    acceptLanguage = null,
  } = opts;

  // 1. Stored locale (user previously chose language manually)
  if (storedLocale && isSupportedLocale(storedLocale)) {
    return { locale: storedLocale as LocaleCode, source: 'stored', countryCode };
  }

  // 2. Country from CDN/proxy headers → map to locale
  if (countryCode) {
    const fromCountry = localeFromCountry(countryCode);
    if (fromCountry) {
      return { locale: fromCountry, source: 'country', countryCode };
    }
  }

  // 3. Accept-Language header → best supported match
  if (acceptLanguage) {
    const fromBrowser = normalizeAcceptLanguage(acceptLanguage, SUPPORTED_LOCALES);
    if (fromBrowser) {
      return { locale: fromBrowser as LocaleCode, source: 'browser', countryCode };
    }
  }

  // 4. Default
  return { locale: DEFAULT_LOCALE, source: 'default', countryCode };
}

function isSupportedLocale(code: string): code is LocaleCode {
  return SUPPORTED_LOCALES.includes(code as LocaleCode);
}

/**
 * Build a bootstrap response for the client — locale + metadata.
 * Use this in SSR/edge to avoid a client-side detection round-trip.
 */
export function buildBootstrapResult(opts: DetectInitialLocaleOptions = {}): {
  locale: LocaleCode;
  source: string;
  countryCode: string | null;
} {
  const result = detectInitialLocale(opts);
  return {
    locale: result.locale,
    source: result.source,
    countryCode: result.countryCode,
  };
}