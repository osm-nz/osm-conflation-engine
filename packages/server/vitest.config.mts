import { join } from 'node:path';
import { defineConfig } from 'vitest/config';
import {
  cloudflareTest,
  readD1Migrations,
} from '@cloudflare/vitest-pool-workers';

const migrationsPath = join(import.meta.dirname, 'migrations');
const migrations = await readD1Migrations(migrationsPath);

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: './wrangler.json',
      },
      miniflare: {
        bindings: { TEST_MIGRATIONS: migrations },
      },
    }),
  ],
  test: {
    globalSetup: './src/__tests__/setup-tests-global.ts',
    setupFiles: ['./src/__tests__/setup-tests.ts'],
  },
});
