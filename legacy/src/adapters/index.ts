// Route adapter barrel — copy the file you need into your project.
// No runtime dependencies in this scaffold. Framework imports are comments only.

export { geoCountryHandler as expressGeoCountryHandler } from './express-route';
export { geoCountryHandler as fastifyGeoCountryHandler } from './fastify-route';
export { geoCountryHandler as honoGeoCountryHandler } from './hono-route';
export { GET as nextGeoCountryHandler } from './next-app-route';