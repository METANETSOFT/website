import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

// Metanetsoft marketing site — TanStack Start (Vite SSR React) + Tailwind v4.
// Pattern copied/trimmed from foxapplicant apps/web (no Convex/onnx/sentry).
export default defineConfig({
  server: { host: '127.0.0.1', port: 3040, allowedHosts: true },
  resolve: { tsconfigPaths: true },
  plugins: [nitro(), tailwindcss(), tanstackStart(), viteReact()],
})
