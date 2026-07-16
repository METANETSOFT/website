# Metanetsoft marketing site — TanStack Start (Vite SSR React) + Nitro node-server.
# Single-package app at repo root (legacy plain-TS site lives in legacy/, not built here).
FROM node:24-slim AS build
WORKDIR /app

# NOTE: package-lock.json is intentionally NOT copied — npm's optional-deps bug
# (#4828) skips the platform-native rolldown binding (Vite 8) when a lockfile is
# present. A lockfile-free install fetches the correct linux-x64 binding.
COPY package.json ./
RUN npm install --include=optional --legacy-peer-deps

COPY tsconfig.json tsr.config.json vite.config.ts ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=build /app/.output .output
EXPOSE 3000
# node:24-slim has no curl/wget — health-check via node's own http module so
# Traefik/Dokploy only routes traffic once the container reports healthy.
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://127.0.0.1:3000/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"]
CMD ["node", ".output/server/index.mjs"]
