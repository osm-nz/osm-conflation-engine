import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import { z } from 'zod';

export const IgnoreListModel = sqliteTable(
  'ignore_list',
  {
    refTag: text('refTag').notNull(),
    rowId: text('rowId').notNull(),
    username: text('username').notNull(),
    operator: text('operator').notNull(),
    timestamp: text('timestamp').notNull(),
    changeset: integer('changeset'),
    local_key: text('local_key').notNull(),
    label: text('label').notNull(),
    note: text('note').notNull(),
    reviews: text('reviews', { mode: 'json' }).$type<IgnoreListReview[]>(),
    review_decision: integer('review_decision').$type<0 | 1>(),
  },
  (table) => [primaryKey({ columns: [table.refTag, table.rowId] })],
);

export const IgnoreListReviewSchema = z.object({
  review_username: z.string().describe('OSM username'),
  review_timestamp: z
    .string()
    .describe('timestamp when the review was created/updated (ISO Date)'),
  review_decision: z.boolean().describe('true = approve, false = reject'),
  review_comment: z.string().describe('comment/note written by the reviewer'),
});

export const IgnoreListSchema = z.object({
  refTag: z
    .string()
    .describe('The OSM tag used for the primary key (typically ref:*)'),
  rowId: z.string().describe('Primary key of the row being ignored'),
  username: z
    .string()
    .describe(
      'OSM username of the user who ignored the feature, or deleted the feature',
    ),
  operator: z
    .string()
    .describe(
      "`self` = an importer deleted a feature; otherwise it's an attested link to the git workflow that triggered it",
    ),
  timestamp: z
    .string()
    .describe('Timestamp when the feature was ignored (ISO Date)'),
  changeset: z
    .number()
    .nullable()
    .describe('Only present if the operator is `changeset_watcher`'),
  local_key: z
    .string()
    .describe(
      'A local_key which identifies this feature, stored just as a label.',
    ),
  label: z
    .string()
    .describe('A label for the feature, to make the list more readable'),
  note: z
    .string()
    .describe(
      'If `operator=self`, this is the note written by the importer. If `operator=changeset_watcher`, this is the changeset comment.',
    ),
  reviews: z
    .array(IgnoreListReviewSchema)
    .nullable()
    .describe('importers’ review decisions'),
  review_decision: z
    .union([z.literal(0), z.literal(1)])
    .nullable()
    .describe('Derived from `reviews`: 1 = approve, 0 = reject'),
});

export type IgnoreListReview = z.infer<typeof IgnoreListReviewSchema>;
export type IgnoreList = z.infer<typeof IgnoreListSchema>;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testFwd!: typeof IgnoreListModel.$inferSelect;
testFwd satisfies IgnoreList;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testBwd!: IgnoreList;
testBwd satisfies typeof IgnoreListModel.$inferSelect;
