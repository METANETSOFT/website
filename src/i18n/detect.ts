// Pure locale-picking logic (no server/client APIs) — used by the SSR
// detector (root loader) and reusable on the client.
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  BROWSER_LANG_NORMALIZE,
  isSupportedLocale,
} from './locales'
import type { LocaleCode } from './types'

export const LOCALE_COOKIE = 'metanet.locale'

export function pickLocale(
  cookieVal?: string | null,
  acceptLanguage?: string | null,
): LocaleCode {
  if (cookieVal && isSupportedLocale(cookieVal)) return cookieVal as LocaleCode

  if (acceptLanguage) {
    // parse "tr-TR,tr;q=0.9,en;q=0.8" → ordered tags
    const tags = acceptLanguage
      .split(',')
      .map((p) => p.split(';')[0].trim())
      .filter(Boolean)
    for (const tag of tags) {
      if (isSupportedLocale(tag)) return tag as LocaleCode
      const lower = tag.toLowerCase()
      const norm =
        BROWSER_LANG_NORMALIZE[lower] ??
        BROWSER_LANG_NORMALIZE[lower.split('-')[0]]
      if (norm && SUPPORTED_LOCALES.includes(norm)) return norm
      const base = tag.split('-')[0]
      if (isSupportedLocale(base)) return base as LocaleCode
    }
  }
  return DEFAULT_LOCALE
}
