/**
 * Framework-agnostic HTTP response helpers.
 * Use these to build normalised JSON responses without importing framework types.
 */

export interface JsonResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

export function jsonBody(data: unknown, status = 200): string {
  return JSON.stringify(data);
}

export function jsonHeaders(status = 200): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
  };
}

/**
 * Parse a comma-separated Accept-Language header value into an ordered list.
 * e.g. "en-US,en;q=0.9,de;q=0.8" → ["en-US", "en", "de"]
 */
export function parseAcceptLanguage(header: string | null): string[] {
  if (!header) return [];
  return header
    .split(',')
    .map(part => {
      const [lang, q] = part.trim().split(';q=');
      return { lang: lang.trim(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .map(({ lang }) => lang);
}

/**
 * Normalize an Accept-Language tag to the best supported locale match.
 * Returns null if no supported locale matches.
 */
export function normalizeAcceptLanguage(
  acceptLanguageHeader: string | null,
  supportedLocales: string[],
): string | null {
  const langs = parseAcceptLanguage(acceptLanguageHeader);
  for (const lang of langs) {
    // Exact match first
    if (supportedLocales.includes(lang)) return lang;
    // Prefix match (e.g. "zh-CN" supports "zh")
    const prefix = lang.split('-')[0];
    const match = supportedLocales.find(l => l.startsWith(prefix + '-') || l === prefix);
    if (match) return match;
  }
  return null;
}