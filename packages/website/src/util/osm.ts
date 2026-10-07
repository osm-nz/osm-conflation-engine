import type { OsmFeatureTypeShort, OsmId } from '@osm-conflation-engine/cli';
import type { OsmFeatureType, Tags } from 'osm-api';

export const EXPAND_FEATURE_TYPE: Record<OsmFeatureTypeShort, OsmFeatureType> =
  {
    n: 'node',
    w: 'way',
    r: 'relation',
  };

export function osmLink(osmId: OsmId) {
  const type = EXPAND_FEATURE_TYPE[osmId[0] as OsmFeatureTypeShort];
  return `https://osm.org/${type}/${osmId.slice(1)}`;
}

export function mergeTags(...tagsList: Tags[]): Tags {
  const merged: Tags = {};
  for (const tags of tagsList) {
    for (const key in tags) {
      if (!merged[key]) {
        merged[key] = tags[key]!;
      } else if (merged[key] !== tags[key]) {
        merged[key] += `;${tags[key]}`;
      }
    }
  }
  return merged;
}
