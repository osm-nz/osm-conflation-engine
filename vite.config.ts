import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '', // use relative paths
  plugins: [react()],
  esbuild: {
    target: 'es2022',
  },
  server: {
    headers: {
      // Shared memory is a potential security vulnerability, so
      // we need to explicitly allow it. See:
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: { allow: ['..'] },
  },
  optimizeDeps: {
    include: ['papaparse'],
    exclude: ['@sqlite.org/sqlite-wasm', 'gtfs-sqlite'],
  },
  build: {
    assetsDir: '',
    assetsInlineLimit: (file) => !file.includes('sw.worker'),
  },
});
