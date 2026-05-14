/**
 * Fastify route handler for GET /api/geo-country
 *
 * Placement: fastify.get('/api/geo-country', geoCountryHandler)
 *
 * Type hints are comments only — no runtime deps enforced.
 *
 * Usage:
 *   import { geoCountryHandler } from './adapters/fastify-route';
 *   fastify.get('/api/geo-country', geoCountryHandler);
 *
 * Or inline copy-ready:
 *   fastify.get('/api/geo-country', async (req, reply) => {
 *     const country = resolveCountry(req as any);
 *     reply.status(200).send(buildGeoCountryResponse(country));
 *   });
 */

import { resolveCountry, buildGeoCountryResponse } from '../server/geo-country';
import type { Request } from '../server/http';

export async function geoCountryHandler(req: any, reply: any): Promise<void> {
  const country = resolveCountry(req as Request);
  reply.status(200).send(buildGeoCountryResponse(country));
}