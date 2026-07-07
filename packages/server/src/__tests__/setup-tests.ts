import { env } from 'cloudflare:workers';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import { beforeAll, inject } from 'vitest';
import { drizzle } from 'drizzle-orm/d1';
import {
  type ChangesetWatchCheckDate,
  ChangesetWatchCheckDateModel,
  type IgnoreList,
  IgnoreListModel,
  type LockedLayers,
  LockedLayersModel,
} from '../db/index.js';

const MOCK_IGNORE_LIST: IgnoreList[] = [
  {
    refTag: 'ref:example',
    rowId: 'row1',
    changeset: null,
    note: 'hii i clicked ignoree~',
    local_key: '12 Example Street',
    label: 'Hadestown',
    operator: 'self',
    username: 'kylenz_linz',
    review_decision: null,
    reviews: null,
    timestamp: '2021-04-06T11:48:15.611Z',
  },
];

const MOCK_LOCKED_LAYERS: LockedLayers[] = [
  {
    // not expired
    refTag: 'ref:example',
    datasetId: 'r1',
    timestamp: '2045-01-01',
    ttl: 3600,
    username: 'userA',
  },
  {
    // expired
    refTag: 'ref:example',
    datasetId: 'r2',
    timestamp: '2021-01-01',
    ttl: 3600,
    username: 'userA',
  },
];

const MOCK_CHECK_DATES: ChangesetWatchCheckDate[] = [
  {
    operator: 'https://github.com/example/example',
    refTag: 'ref:example',
    timestamp: '2021-05-17',
  },
];

beforeAll(async () => {
  const db = drizzle(env.d1_db);
  await db.run(inject('migrations'));

  /* eslint-disable unicorn/no-unused-array-method-return -- false positive */
  for (const row of MOCK_IGNORE_LIST) {
    await db.insert(IgnoreListModel).values(row);
  }
  for (const row of MOCK_LOCKED_LAYERS) {
    await db.insert(LockedLayersModel).values(row);
  }
  for (const row of MOCK_CHECK_DATES) {
    await db.insert(ChangesetWatchCheckDateModel).values(row);
  }
});
