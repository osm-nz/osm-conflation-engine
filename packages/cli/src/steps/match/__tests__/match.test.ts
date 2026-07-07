import { join } from 'node:path';
import { devNull } from 'node:os';
import { describe, expect, it } from 'vitest';
import type { Point } from 'geojson';
import { match } from '../index.js';
import {
  type Ctx,
  MatchType,
  type OSMData,
  type SourceData,
} from '../../../types/internal.def.js';
import {
  type DatasetId,
  type OsmFeature,
  OsmFlags,
  type OsmId,
  type Vec2,
} from '../../../types/callbacks.def.js';

type MockSource = { id: string; house: string };

const ctx = {
  callbacks: {
    getLocalKeyForOsm: (o) => o.tags['addr:housenumber'],
    getLocalKeyForSource: (o) => o.properties.house,
  },
  tempFileNames: {
    matches: devNull,
    ignore_list: join(
      import.meta.dirname,
      '../../../__tests__/empty-ignoreList.json',
    ),
  },
} as Ctx<Point, MockSource>;

const createSourceRow = (id: string): SourceData<Point, MockSource> => {
  const loc: Vec2 = [176, -36 + +id.slice(1) / 1e5];
  return {
    [<DatasetId>id]: {
      type: 'Feature',
      id,
      centroid: loc,
      properties: { id, house: id.slice(1) },
      geometry: { type: 'Point', coordinates: loc },
      sectors: ['s1'],
    },
  };
};

const createOsmFeature = (
  oId: OsmId,
  sId: string | undefined,
  houseNumber?: string,
): OsmFeature => ({
  // should be delete
  id: oId,
  tags: {
    ...(sId ? { 'ref:MY_ID': <DatasetId>sId } : {}),
    ...(houseNumber ? { 'addr:housenumber': houseNumber } : {}),
  },
  centroid: [176, -36],
  sectors: ['s1'],
  flags: OsmFlags.None,
});

const sourceData: SourceData = {
  ...createSourceRow('r1'), // should be 1:1 match
  ...createSourceRow('r2'), // should be CREATE (missing in OSM) or auto-matched to n5
  ...createSourceRow('r3'), // should be 1:many match
  ...createSourceRow('r4'), // should be auto-matched to n7 which has a wrong ref
  ...createSourceRow('r5'), // should be many:1 match with r6
  ...createSourceRow('r6'), // should be many:1 match with r5
  ...createSourceRow('r7'), // should be many:1 match with r8 (and there's a standalone r7 in the DB)
  ...createSourceRow('r8'), // should be many:1 match with r7
  ...createSourceRow('r9'), // should be CREATE (missing in OSM, nothing to auto-match to)
  ...createSourceRow('r10'), // should be CREATE (missing in OSM, two equally good candidates: n11 and n12)
};

const osmData: OSMData = {
  withRef: {
    [<DatasetId>'r1']: createOsmFeature('n1', 'r1'),
    [<DatasetId>'invalidd']: createOsmFeature('n6', 'invalidd'),
    [<DatasetId>'r4_old']: createOsmFeature('n7', 'r4_old', '4'),
    [<DatasetId>'r7']: createOsmFeature('n10', 'r7'),
  },
  duplicateRefs: {
    [<DatasetId>'r3']: [
      createOsmFeature('n2', 'r3'),
      createOsmFeature('n3', 'r3'),
    ],
  },
  noRef: {
    n4: createOsmFeature('n4', undefined), // ignored, not a candiate
    n5: createOsmFeature('n5', undefined, '2'), // this will be a candiate for r2
    n11: createOsmFeature('n11', undefined, '10'), // n11 and n12 are both candiates for r10
    n12: createOsmFeature('n12', undefined, '10'), // n11 and n12 are both candiates for r10
  },
  semi: {
    [<DatasetId>'r5;r6']: createOsmFeature('n8', 'r5;r6'),
    [<DatasetId>'r7;r8']: createOsmFeature('n9', 'r7;r8'),
  },
  count: -123,
};

describe(match, () => {
  it('works', async () => {
    expect(await match(ctx, sourceData, osmData)).toStrictEqual({
      output: {
        [MatchType.OneToOne]: [
          { source: 'r1', osm: 'n1' },
          { source: 'r2', osm: 'n5' }, // auto matched, even tho n5 is missing the ref tag
          { source: 'r4', osm: 'n7' }, // auto matched (r4 has an old ref tag)
        ],
        [MatchType.OneToMany]: [
          //
          { source: 'r3', osm: ['n2', 'n3'] },
        ],
        [MatchType.ManyToOne]: {
          n8: ['r5', 'r6'],
        },
        [MatchType.ManyToMany]: [
          //
          { osm: ['n10', 'n9'], source: ['r7', 'r8'] },
        ],
        [MatchType.Delete]: [
          //
          'invalidd',
        ],
        [MatchType.Guess]: [
          { source: 'r9', osmCandidates: [] },
          { source: 'r10', osmCandidates: ['n11', 'n12'] },
        ],
      },
    });
  });
});
