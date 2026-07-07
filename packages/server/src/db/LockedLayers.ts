import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';
import { z } from 'zod';

export const LockedLayersModel = sqliteTable(
  'locked_layers',
  {
    refTag: text('refTag').notNull(),
    datasetId: text('datasetId').notNull(),
    username: text('username').notNull(),
    timestamp: text('timestamp').notNull(),
    ttl: integer('ttl').notNull(),
  },
  (table) => [primaryKey({ columns: [table.refTag, table.datasetId] })],
);

export const LockedLayersSchema = z.object({
  refTag: z
    .string()
    .describe('The OSM tag used for the primary key (typically ref:*)'),
  datasetId: z
    .string()
    .describe(
      'The ID of the .osmPatch.geo.json file. This ID includes a hash which changes on each sync',
    ),
  username: z
    .string()
    .describe('OSM username of the user who locked this layer'),
  timestamp: z
    .string()
    .describe('Timestamp when the layer was locked (ISO Date)'),
  ttl: z
    .number()
    .describe(
      'In seconds, the length of the lock starting from the timestamp field',
    ),
});
export type LockedLayers = z.infer<typeof LockedLayersSchema>;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testFwd!: typeof LockedLayersModel.$inferSelect;
testFwd satisfies LockedLayers;

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testBwd!: typeof LockedLayersModel.$inferSelect;
testBwd satisfies LockedLayers;
