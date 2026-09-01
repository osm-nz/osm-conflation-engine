import { env } from 'cloudflare:workers';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import { beforeAll, inject } from 'vitest';
import { drizzle } from 'drizzle-orm/d1';
import type { ConflateResult } from '@osm-conflation-engine/cli';
import {
  type ChangesetWatchCheckDate,
  ChangesetWatchCheckDateModel,
  type IgnoreList,
  IgnoreListModel,
  type LockedLayers,
  LockedLayersModel,
  type RunHistory,
  RunHistoryModel,
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

export const MOCK_METRICS: ConflateResult = {
  config: {
    $schema: '...',
    metadata: {
      region: 'EG',
      name: 'Example',
      description: 'Exampleee',
      wiki_page: 'https://wiki.osm.org/Example',
      git_repository: 'https://github.com/example/example',
    },
    source_data: {
      type: 'file',
      file: '/path/to/processed.geo.jsonl',
    },
    o_data: {
      source: {
        type: 'pbf',
        pbf_url:
          'https://osm-internal.download.geofabrik.de/example/example.osm.pbf',
        pbf_filter: ['addr:housenumber+addr:street,ref:example'],
      },
      tags_to_keep: ['example'],
    },
    merge: {
      dataset_column: 'id',
      osm_key: 'ref:example',
    },
    output: {
      folder: '/path/to/folder',
    },
  },
  warnings: [],
  countsByPhase: {
    init: {
      sourceDataset: 2308966,
      ignored: 788,
      osm: {
        withRef: 2298129,
        noRef: 27933,
        semi: 90,
        duplicateRefs: 151,
        lastEditedByImporter: 2086484,
        recentlyChanged: 2326303,
        recentlyChecked: 2543,
      },
    },
    matched: {
      1: 2296192,
      2: 60,
      3: 43,
      4: 1,
      5: 1996,
      6: 12002,
    },
    conflated: {
      create: 15012,
      edit: 18796,
      delete: 1863,
      perfect: 4603924,
    },
  },
};

const MOCK_RUN_HISTORY: RunHistory[] = [
  {
    operator: 'https://github.com/example/example/actions/runs/2#octocat',
    refTag: 'ref:example',
    timestamp: '2021-06-17T00:00:00.000Z',
    metrics: MOCK_METRICS,
  },
  {
    operator: 'https://github.com/example/example/actions/runs/3#octocat',
    refTag: 'ref:other',
    timestamp: '2021-07-17T00:00:00.000Z',
    metrics: null,
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
  for (const row of MOCK_RUN_HISTORY) {
    await db.insert(RunHistoryModel).values(row);
  }
});
