import type { OsmFeatureTypeShort, OsmId } from '@osm-conflation-engine/cli';
import type { OsmFeatureType } from 'osm-api';

const EXPAND_FEATURE_TYPE: Record<OsmFeatureTypeShort, OsmFeatureType> = {
  n: 'node',
  w: 'way',
  r: 'relation',
};

export function osmLink(osmId: OsmId) {
  const type = EXPAND_FEATURE_TYPE[osmId[0] as OsmFeatureTypeShort];
  return `https://osm.org/${type}/${osmId.slice(1)}`;
}
