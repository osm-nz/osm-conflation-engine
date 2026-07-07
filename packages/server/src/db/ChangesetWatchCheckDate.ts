import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { z } from 'zod';

export const ChangesetWatchCheckDateModel = sqliteTable(
  'changeset_watch_check_date',
  {
    refTag: text('refTag').notNull().primaryKey(),
    operator: text('operator').notNull(),
    timestamp: text('timestamp').notNull(),
  },
);

export const ChangesetWatchCheckDateSchema = z.object({
  refTag: z
    .string()
    .describe('The OSM tag used for the primary key (typically ref:*)'),

  operator: z
    .string()
    .describe(
      'An attested link to the git workflow that wrote this value to the DB',
    ),
  timestamp: z
    .string()
    .describe('Timestamp when the changeset_watch script last ran (ISO Date)'),
});

export type ChangesetWatchCheckDate = z.infer<
  typeof ChangesetWatchCheckDateSchema
>;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testFwd!: typeof ChangesetWatchCheckDateModel.$inferSelect;
testFwd satisfies ChangesetWatchCheckDate;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testBwd!: ChangesetWatchCheckDate;
testBwd satisfies typeof ChangesetWatchCheckDateModel.$inferSelect;
