import { geoDistance } from 'd3-geo';
import type { Ctx, OsmFeature, SourceDataFeature } from '../../types/index.js';
import { EARTH_RADIUS } from '../../common/geo.js';

const featureToKey = new Map<OsmFeature, string>();

/** If there are multiple osm addresses found, none of which have a linz ref, find the most likely ones */
export const findPotentialOFeatures = (
  ctx: Ctx,
  sourceDataFeature: SourceDataFeature,
  osmFeaturesWithNoRef: OsmFeature[],
): OsmFeature[] => {
  const sourceKey = ctx.callbacks.getLocalKeyForSource(sourceDataFeature);

  const perfectMatches = osmFeaturesWithNoRef
    .filter((oFeature) => {
      // this 1st filter runs millions of times and needs to be fast
      let key = featureToKey.get(oFeature);
      if (!key) {
        key = ctx.callbacks.getLocalKeyForOsm(oFeature);
        featureToKey.set(oFeature, key);
      }
      return key === sourceKey;
    })
    .map((oFeature) => {
      // all following maps/filters only runs tens of times, so they can be expensive
      const offsetMetres =
        EARTH_RADIUS *
        geoDistance(oFeature.centroid, sourceDataFeature.centroid);

      return Object.assign(oFeature, { offset: offsetMetres });
    })
    // if our best guess is more than 200m from the gazetted location, it's definitely wrong
    .filter((o) => o.offset < 200)
    .toSorted((a, b) => a.offset - b.offset);

  return perfectMatches;
};
