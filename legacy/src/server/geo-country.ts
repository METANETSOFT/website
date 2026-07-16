/**
 * Server-side geo-country resolution helpers.
 *
 * Strategy (per plan):
 * - Read country from trusted CDN/proxy headers (cf-ipcountry, x-vercel-ip-country,
 *   cloudfront-viewer-country, x-country-code). These are set by edge/CDN and
 *   the raw IP is never exposed to the client.
 * - When only IP is available (no country header), keep a provider interface but
 *   DO NOT call external services directly — caller owns the lookup.
 *
 * Works with: Node.js request objects, Fetch Request, Next.js App Router requests,
 * Hono Context, and any framework that passes headers in one of those shapes.
 */

import { Request, getHeaderFirst, getClientIP } from './http';

export { getClientIP };

export interface GeoProvider {
  lookupCountry(ip: string): Promise<string | null>;
}

const COUNTRY_HEADER_KEYS = [
  'cf-ipcountry',
  'x-vercel-ip-country',
  'cloudfront-viewer-country',
  'x-country-code',
] as const;

export function resolveCountryFromHeaders(req: Request): string | null {
  const headers = req.headers ?? {};
  const val = getHeaderFirst(headers, ...COUNTRY_HEADER_KEYS);
  if (!val) return null;
  return val.toUpperCase().trim();
}

export function resolveCountry(req: Request): string | null {
  return resolveCountryFromHeaders(req);
}

/**
 * Build the public /api/geo-country response object.
 * Returns null when country cannot be determined — client handles fallback.
 */
export interface GeoCountryResponse {
  countryCode: string | null;
}

export function buildGeoCountryResponse(country: string | null): GeoCountryResponse {
  return { countryCode: country ?? null };
}

export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code.toUpperCase());
}