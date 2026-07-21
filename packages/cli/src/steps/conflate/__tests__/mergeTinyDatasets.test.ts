import { describe, expect, it, vi } from 'vitest';
import type { OsmPatchFeature } from 'osm-api';
import { mergeTags, mergeTinyDatasets } from '../mergeTinyDatasets.js';
import type {
  HandlerReturnWithBBox,
  OutputLayer,
} from '../../../types/internal.def.js';
import { calcBBox } from '../../../common/calcBBox.js';

vi.mock('../../../constants/defaults.js', () => ({
  MAX_ITEMS_PER_DATASET: 7,
  MIN_ITEMS_PER_DATASET: 3,
  MAX_BBOX_DEGREES: Infinity,
}));

function createNFeatures(...ids: number[]): OutputLayer {
  const features: OsmPatchFeature[] = ids.map((i) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-i * 2, i] },
    properties: { i: `${i}` },
    id: i,
  }));
  return {
    sectorIds: ['a'],
    features,
    changesetTags: {
      created_by: 'me',
      comment: `Example Layer - ${ids.join('')}`,
    },
    bbox: calcBBox(features),
  };
}

function simplifyOutput(result: HandlerReturnWithBBox) {
  const output: Record<string, unknown[]> = {};
  for (const key in result) {
    output[key] = result[key]!.features.map((f) => f.id);
  }
  return output;
}

describe(mergeTinyDatasets, () => {
  it('does not merge if the merged result would be too big', () => {
    expect(
      simplifyOutput(
        mergeTinyDatasets({
          a: createNFeatures(1, 2),
          b: createNFeatures(3, 4, 5, 6, 7, 8, 9, 10),
        }),
      ),
    ).toStrictEqual({
      a: [1, 2],
      b: [3, 4, 5, 6, 7, 8, 9, 10],
    });
  });

  it('can combine two layers that are too small', () => {
    expect(
      simplifyOutput(
        mergeTinyDatasets({
          a: createNFeatures(1, 2, 3),
          b: createNFeatures(4, 5, 6),
          c: createNFeatures(7, 8), // not included, because it would be too big
        }),
      ),
    ).toStrictEqual({
      'a;b': [1, 2, 3, 4, 5, 6],
      c: [7, 8],
    });
  });

  it('can combine many layers that are too small', () => {
    expect(
      simplifyOutput(
        mergeTinyDatasets({
          a: createNFeatures(1, 2),
          b: createNFeatures(3, 4),
          c: createNFeatures(5, 6),
          d: createNFeatures(7, 8),
        }),
      ),
    ).toStrictEqual({
      'a;b': [1, 2, 3, 4],
      'c;d': [5, 6, 7, 8],
    });
  });

  it('can combine >2 layers that are too small', () => {
    expect(
      simplifyOutput(
        mergeTinyDatasets({
          a: createNFeatures(1),
          b: createNFeatures(2),
          c: createNFeatures(3),
          d: createNFeatures(4, 5, 6, 7, 8, 9, 10),
        }),
      ),
    ).toStrictEqual({
      'c;a;b': [3, 1, 2],
      d: [4, 5, 6, 7, 8, 9, 10],
    });
  });

  it('correctly merges other meta attributes', () => {
    expect(
      mergeTinyDatasets({
        a: createNFeatures(1, 2),
        b: createNFeatures(3, 4),
        c: createNFeatures(5, 6),
        d: createNFeatures(7, 8),
      }),
    ).toStrictEqual({
      'a;b': {
        bbox: { minLng: -8, maxLng: -2, minLat: 1, maxLat: 4 }, // correctly merged
        changesetTags: {
          created_by: 'me', // same value in all datasets
          comment: 'Example Layer - 12;Example Layer - 34', // merged
        },
        features: [
          {
            geometry: { coordinates: [-2, 1], type: 'Point' },
            id: 1,
            properties: { i: '1' },
            type: 'Feature',
          },
          {
            geometry: { coordinates: [-4, 2], type: 'Point' },
            id: 2,
            properties: { i: '2' },
            type: 'Feature',
          },
          {
            geometry: { coordinates: [-6, 3], type: 'Point' },
            id: 3,
            properties: { i: '3' },
            type: 'Feature',
          },
          {
            geometry: { coordinates: [-8, 4], type: 'Point' },
            id: 4,
            properties: { i: '4' },
            type: 'Feature',
          },
        ],
        sectorIds: ['a'],
      },
      'c;d': {
        bbox: { minLng: -16, maxLng: -10, minLat: 5, maxLat: 8 }, // correctly merged
        changesetTags: {
          created_by: 'me',
          comment: 'Example Layer - 56;Example Layer - 78',
        },
        features: [
          {
            geometry: { coordinates: [-10, 5], type: 'Point' },
            id: 5,
            properties: { i: '5' },
            type: 'Feature',
          },
          {
            geometry: { coordinates: [-12, 6], type: 'Point' },
            id: 6,
            properties: { i: '6' },
            type: 'Feature',
          },
          {
            geometry: { coordinates: [-14, 7], type: 'Point' },
            id: 7,
            properties: { i: '7' },
            type: 'Feature',
          },
          {
            geometry: { coordinates: [-16, 8], type: 'Point' },
            id: 8,
            properties: { i: '8' },
            type: 'Feature',
          },
        ],
        sectorIds: ['a'],
      },
    });
  });
});

describe(mergeTags, () => {
  it('handle conflicts', () => {
    expect(
      mergeTags({ a: '1', b: '2', c: '3' }, { b: '2', c: '4', d: '5' }),
    ).toStrictEqual({
      a: '1', // L only
      b: '2', // L & R have same value
      c: '3;4', // L & R have different value
      d: '5', // R only
    });
  });
});
