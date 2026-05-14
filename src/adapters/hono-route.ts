/**
 * Hono route handler for GET /api/geo-country
 *
 * Placement: app.get('/api/geo-country', geoCountryHandler)
 *
 * Hono is runtime-agnostic — works on Node, Deno, Bun, Cloudflare Workers.
 *
 * Usage:
 *   import { Hono } from 'hono';
 *   import { geoCountryHandler } from './adapters/hono-route';
 *   const app = new Hono();
 *   app.get('/api/geo-country', geoCountryHandler);
 *
 * Or inline copy-ready:
 *   app.get('/api/geo-country', (c) => {
 *     const country = resolveCountry(c.req.raw as any);
 *     return c.json(buildGeoCountryResponse(country));
 *   });
 */

import { resolveCountry, buildGeoCountryResponse } from '../server/geo-country';
import type { Request } from '../server/http';

export async function geoCountryHandler(c: { req: { raw: Request } }): Promise<Response> {
  const country = resolveCountry(c.req.raw);
  const payload = buildGeoCountryResponse(country);

  // Plain Response — no hono import needed
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

  // With Hono's c.json() (requires 'hono' package):
  // return c.json(payload, 200);
}