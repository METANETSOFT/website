/**
 * Client-side IP country resolution.
 * Calls /api/geo-country which reads country from CDN/proxy headers — no direct IP lookup here.
 */

import type { GeoCountryResponse } from './types';
import { COUNTRY_TO_LOCALE } from './locales';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof fetch !== 'undefined';
}

export function countryFromGeoResponse(res: GeoCountryResponse | null): string | null {
  if (!res) return null;
  if (typeof res.countryCode === 'string') {
    return res.countryCode.toUpperCase().trim() || null;
  }
  return null;
}

export function localeFromCountry(countryCode: string): string | null {
  const mapped = COUNTRY_TO_LOCALE[countryCode.toUpperCase()];
  return mapped ?? null;
}

/**
 * Resolve visitor country by calling internal /api/geo-country endpoint.
 * Returns normalized country code or null on failure / non-browser / SSR.
 */
export async function resolveCountryByIP(): Promise<string | null> {
  if (!isBrowser()) return null;
  try {
    const res = await fetch('/api/geo-country', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data: GeoCountryResponse = await res.json();
    return countryFromGeoResponse(data);
  } catch {
    return null;
  }
}