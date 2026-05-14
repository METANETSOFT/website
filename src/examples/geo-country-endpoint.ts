/**
 * Example /api/geo-country endpoint wiring for common frameworks.
 * Copy the relevant section into your route file — no external imports needed here.
 *
 * Contract:
 *   GET /api/geo-country
 *   Response 200: { "countryCode": "DE" }  or  { "countryCode": null }
 *
 * Strategy:
 *   - Reads country from CDN/proxy headers (cf-ipcountry, x-vercel-ip-country, etc.)
 *   - Raw IP is never logged or returned
 *   - Status always 200 — client handles graceful fallback
 */

import { resolveCountry, buildGeoCountryResponse } from '../server/geo-country';
import type { Request } from '../server/http';

// ── Pure helper — no framework coupling ─────────────────────────────────────

export function handleGeoCountryRequest(req: Request): { status: number; body: string; contentType: string } {
  const country = resolveCountry(req);
  const payload = buildGeoCountryResponse(country); // always returns { countryCode: ... }
  return {
    status: 200,
    body: JSON.stringify(payload),
    contentType: 'application/json; charset=utf-8',
  };
}

// ── Express ──────────────────────────────────────────────────────────────────

// app.get('/api/geo-country', (req, res) => {
//   const { status, body, contentType } = handleGeoCountryRequest(req as unknown as Request);
//   res.status(status).type(contentType).send(body);
// });

// ── Fastify ───────────────────────────────────────────────────────────────────

// fastify.get('/api/geo-country', async (req, reply) => {
//   const { body, contentType } = handleGeoCountryRequest(req as unknown as Request);
//   return reply.header('Content-Type', contentType).send(body);
// });

// ── Hono ─────────────────────────────────────────────────────────────────────

// app.get('/api/geo-country', (c) => {
//   const { body } = handleGeoCountryRequest(c.req.raw as Request);
//   return c.body(body, 200, 'application/json');
// });

// ── Next.js App Router ────────────────────────────────────────────────────────

// export async function GET(request: Request) {
//   const { body, status } = handleGeoCountryRequest(request as Request);
//   return new Response(body, { status, headers: { 'Content-Type': 'application/json' } });
// });

// ── Node std/http ─────────────────────────────────────────────────────────────

// function handleGeoCountry(req: IncomingMessage, res: ServerResponse) {
//   const { status, body, contentType } = handleGeoCountryRequest(req as unknown as Request);
//   res.writeHead(status, { 'Content-Type': contentType });
//   res.end(body);
// }