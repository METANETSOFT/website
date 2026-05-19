import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  plugins: [],

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/entry-client.ts'),
      formats: ['es'],
      fileName: () => 'assets/entry-client',
    },
    rollupOptions: {
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
