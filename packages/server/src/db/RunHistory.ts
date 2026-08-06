import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';

export const RunHistoryModel = sqliteTable(
  'run_history',
  {
    refTag: text('refTag').notNull(),
    operator: text('operator').notNull(),
    timestamp: text('timestamp').notNull(),
  },
  (table) => [primaryKey({ columns: [table.refTag, table.timestamp] })],
);

export const RunHistorySchema = z.object({
  refTag: z
    .string()
    .describe('The OSM tag used for the primary key (typically ref:*)'),
  operator: z
    .string()
    .describe("it's an attested link to the git workflow that triggered it"),
  timestamp: z.string().describe('Timestamp when the run completed (ISO Date)'),
});
export type RunHistory = z.infer<typeof RunHistorySchema>;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testFwd!: typeof RunHistoryModel.$inferSelect;
testFwd satisfies RunHistory;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testBwd!: RunHistory;
testBwd satisfies typeof RunHistoryModel.$inferSelect;
