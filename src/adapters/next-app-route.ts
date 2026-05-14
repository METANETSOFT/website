/**
 * Next.js App Router route handler for GET /api/geo-country
 *
 * Placement: app/api/geo-country/route.ts
 *
 * Requirements: next ^14+ (type hints are comments — no runtime import needed)
 *
 * Strategy: reads country from CDN/proxy headers forwarded by the platform.
 * Raw IP is never used. Status always 200 — client handles fallback.
 *
 * Plain Response (no next/server import):
 *   return new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
 *
 * NextResponse alternative:
 *   import { NextResponse } from 'next/server';
 *   return NextResponse.json(payload, { status: 200 });
 */

import { resolveCountry, buildGeoCountryResponse } from '../server/geo-country';
import type { Request } from '../server/http';

export async function GET(request: Request): Promise<Response> {
  const country = resolveCountry(request);
  const payload = buildGeoCountryResponse(country); // always { countryCode: string | null }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}