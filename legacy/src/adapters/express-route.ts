/**
 * Express route handler for GET /api/geo-country
 *
 * Placement: app.get('/api/geo-country', geoCountryHandler)
 *
 * Type hints are comments only — no runtime deps enforced.
 *
 * Usage:
 *   import { geoCountryHandler } from './adapters/express-route';
 *   app.get('/api/geo-country', geoCountryHandler);
 *
 * Or inline copy-ready:
 *   app.get('/api/geo-country', (req, res) => {
 *     const country = resolveCountry(req as any);
 *     res.status(200).json(buildGeoCountryResponse(country));
 *   });
 */

import { resolveCountry, buildGeoCountryResponse } from '../server/geo-country';
import type { Request } from '../server/http';

export function geoCountryHandler(req: any, res: any): void {
  const country = resolveCountry(req as Request);
  res.status(200).json(buildGeoCountryResponse(country));
}