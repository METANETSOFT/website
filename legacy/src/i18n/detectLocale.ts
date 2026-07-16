/**
 * Locale detection — client-side priority.
 * Auto-detection NEVER writes localStorage; only i18n.setLocale() persists.
 */

import type { LocaleCode } from './types';
import { SUPPORTED_LOCALES, BROWSER_LANG_NORMALIZE, DEFAULT_LOCALE } from './locales';
import { getStoredLocale } from './storage';
import { resolveCountryByIP, localeFromCountry } from './geo';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

function getBrowserLanguages(): string[] {
  if (!isBrowser()) return [];
  const nav = navigator as unknown as { language?: string; languages?: readonly string[] };
  const lang = nav.language || nav.languages?.[0] || '';
  return [lang, ...Array.from(nav.languages || [])];
}

function normalizeBrowserLang(lang: string): LocaleCode | null {
  const exact = BROWSER_LANG_NORMALIZE[lang];
  if (exact) return exact;
  const prefix = lang.split('-')[0];
  const match = SUPPORTED_LOCALES.find(l => l.startsWith(prefix + '-') || l === prefix);
  return match ?? null;
}

export function getBestBrowserLocale(): LocaleCode | null {
  const langs = getBrowserLanguages();
  for (const lang of langs) {
    const normalized = normalizeBrowserLang(lang);
    if (normalized) return normalized;
  }
  return null;
}

/**
 * Detect initial locale using standard priority.
 * Pass skipDetect=true from SSR bootstrap to avoid IP call when locale is pre-seeded.
 */
export async function detectLocale(skipDetect = false): Promise<LocaleCode> {
  // 1. localStorage override (user persisted choice)
  const stored = getStoredLocale();
  if (stored) return stored;

  // 2. IP country via /api/geo-country (skip when SSR pre-seeded)
  if (!skipDetect) {
    const country = await resolveCountryByIP();
    if (country) {
      const locale = localeFromCountry(country) as LocaleCode | null;
      if (locale) return locale;
    }
  }

  // 3. Browser language
  const browserLocale = getBestBrowserLocale();
  if (browserLocale) return browserLocale;

  // 4. Default
  return DEFAULT_LOCALE;
}
