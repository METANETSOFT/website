import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  plugins: [],

  build: {
    ssr: true,
    ssrManifest: false,
    rollupOptions: {
      input: {
        client: resolve(__dirname, 'index.html'),
        'entry-server': resolve(__dirname, 'src/entry-server.ts'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },

  resolve: {
    alias: {
      '@i18n': resolve(__dirname, 'src'),
    },
  },
});