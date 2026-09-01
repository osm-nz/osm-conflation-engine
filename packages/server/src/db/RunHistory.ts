import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';
import type { ConflateResult } from '@osm-conflation-engine/cli';
import { MetricsSchema } from './metrics.js';

export const RunHistoryModel = sqliteTable('run_history', {
  refTag: text('refTag').notNull().primaryKey(),
  operator: text('operator').notNull(),
  timestamp: text('timestamp').notNull(),
  metrics: text('metrics', { mode: 'json' }).$type<ConflateResult>(),
});

export const RunHistorySchema = z.object({
  refTag: z
    .string()
    .describe('The OSM tag used for the primary key (typically ref:*)'),
  operator: z
    .string()
    .describe("it's an attested link to the git workflow that triggered it"),
  timestamp: z.string().describe('Timestamp when the run completed (ISO Date)'),
  metrics: MetricsSchema.nullable(),
});
export type RunHistory = z.infer<typeof RunHistorySchema>;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testFwd!: typeof RunHistoryModel.$inferSelect;
testFwd satisfies RunHistory;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testBwd!: RunHistory;
testBwd satisfies typeof RunHistoryModel.$inferSelect;
