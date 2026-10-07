import { type OsmFeature, type OsmFeatureType, getFeatures } from 'osm-api';

//
// this file is copied from https://github.com/osm-nz/osm-nz.github.io/blame/5b567f1/src/pages/upload/util.ts
//

export function* chunk<T>(array: T[], limit: number): Generator<T[], void> {
  for (let index = 0; index < array.length; index += limit) {
    yield array.slice(index, index + limit);
  }
}

export type ToFetch = Record<OsmFeatureType, number[]>;
export type FetchCache = { [nwrId: string]: OsmFeature };

export async function fetchChunked(
  toFetch: ToFetch,
  existingCache?: FetchCache,
): Promise<FetchCache> {
  const fetched: FetchCache = {};
  for (const _type in toFetch) {
    const type = _type as OsmFeatureType;

    // only fetch the ones that aren't in the cache
    const unchunked = toFetch[type]?.filter(
      (id) => !existingCache?.[type[0]! + id],
    );

    for (const ids of chunk(unchunked, 100)) {
      console.info(`Fetching ${ids.length} ${type}s...`);
      const features = await getFeatures(type, ids);
      for (const feature of features) {
        const nwrId = feature.type[0]! + feature.id;
        fetched[nwrId] = feature;
      }
    }
  }
  return { ...existingCache, ...fetched };
}
