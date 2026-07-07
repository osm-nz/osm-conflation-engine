import { defineConfig } from 'drizzle-kit';
import wrangler from './wrangler.json' with { type: 'json' };

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Dict<string> {
      CLOUDFLARE_ACCOUNT_ID: string;
      CLOUDFLARE_D1_TOKEN: string;
    }
  }
}

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/index.ts',
  out: './migrations',
  driver: 'd1-http',
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    databaseId: wrangler.d1_databases[0]!.database_id,
    token: process.env.CLOUDFLARE_D1_TOKEN,
  },
});
