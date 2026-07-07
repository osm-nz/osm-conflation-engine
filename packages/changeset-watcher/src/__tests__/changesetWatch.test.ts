import {
  type OsmChange,
  type OsmNode,
  getChangesetDiff,
  listChangesets,
} from 'osm-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getLastCheckDate,
  updateIgnoreList,
  updateLastCheckDate,
} from '../api/index.js';
import { checkDiffsForAddress } from '../checkDiffsForAddress.js';
import { run as changesetWatch } from '../index.js';
import type { ChangesetWatchConfig } from '../types.def.js';

vi.mock('osm-api');
vi.mock('../api');
vi.mock('../checkDiffsForAddress');
vi.mock('node:timers/promises', () => ({
  setTimeout: async () => 0,
}));
vi.mock('../patchOsmChange', () => ({
  patchOsmChange: async (x: unknown) => x,
}));

const node = {} as OsmNode;

const MOCK_CHANGESET_DIFFS: Record<number, OsmChange> = {
  90_001: {
    create: [],
    modify: [],
    delete: [node, node, node],
  },
  90_002: {
    create: [],
    modify: [],
    delete: [node],
  },
  90_003: {
    create: [],
    modify: [node],
    delete: [],
  },
};

describe('patchOsmChange', () => {
  beforeEach(() => {
    m(updateLastCheckDate).mockResolvedValue(undefined);
    m(updateIgnoreList).mockResolvedValue(undefined);
    m(checkDiffsForAddress).mockReturnValue([5, 6, 7, 8]);
    m(getLastCheckDate).mockReturnValue('2019-07-03');

    let isFirstTime = true;
    m(getChangesetDiff).mockImplementation(async (csId) => {
      if (csId === 90_002 && isFirstTime) {
        isFirstTime = false;
        throw new Error('Mock Error from OSM API');
      }
      return MOCK_CHANGESET_DIFFS[csId];
    });

    m(listChangesets).mockResolvedValue([
      { id: 90_001, user: 'Maël' }, // this one is too big
      { id: 90_002, user: 'Maël' }, // this one will error the first time, but succeed on retry
      { id: 90_003, user: 'Maël' }, // this one is fine
      { id: 90_004, user: 'Maël_linz' }, // this one will be skipped beacuse it's an import account
      { id: 90_005, user: 'Maël_import' }, // this one will be skipped beacuse it's an import account
    ]);
  });

  it('calls the OSM API and updates the osmChange', async () => {
    const config: ChangesetWatchConfig = {
      authToken: 'example token',
      refTag: 'ref:test',
      watchArea: [165.366211, -47.762509, 179.384766, -33.545548],
      getLocalKey: () => '',
      isImportUser: (username) => /_(linz|import)$/.test(username),
    };
    await changesetWatch(config);

    expect(listChangesets).toHaveBeenCalledTimes(1);
    expect(listChangesets).toHaveBeenCalledWith({
      bbox: [165.366211, -47.762509, 179.384766, -33.545548],
      only: 'closed',
      time: '2019-07-03',
    });

    expect(getChangesetDiff).toHaveBeenCalledTimes(4);
    expect(getChangesetDiff).toHaveBeenNthCalledWith(1, 90001);
    expect(getChangesetDiff).toHaveBeenNthCalledWith(2, 90002);
    expect(getChangesetDiff).toHaveBeenNthCalledWith(3, 90003);
    expect(getChangesetDiff).toHaveBeenNthCalledWith(4, 90002); // retry

    expect(checkDiffsForAddress).toHaveBeenCalledWith(config, [
      {
        cs: { id: 90_003, user: 'Maël' },
        diff: MOCK_CHANGESET_DIFFS[90_003],
      },
      {
        cs: { id: 90002, user: 'Maël', hasRetried: true },
        diff: MOCK_CHANGESET_DIFFS[90_002],
      },
    ]);

    expect(updateIgnoreList).toHaveBeenCalledWith(config, [5, 6, 7, 8]);
    expect(updateLastCheckDate).toHaveBeenCalledWith(config);
  });
});
