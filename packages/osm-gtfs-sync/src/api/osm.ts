import type { OsmFeature } from 'osm-api';
import { del, get, keys, set } from 'idb-keyval';
import type { BBox } from '../types/config.def.js';
import { fetchFromOverpass } from './overpass.js';
import { fetchFromPostpass } from './postpass.js';

export type OsmSource = 'overpass' | 'postpass';

export interface Cache {
  source: OsmSource;
  query: string;
  date: string;
  osmData: OsmFeature[];
}

const CACHE_PREFIX = 'gtfs-cache-';

export async function fetchOsmData(
  source: OsmSource,
  bbox: BBox,
  cacheKey: string,
): Promise<Cache> {
  const cached = await get<Cache>(CACHE_PREFIX + cacheKey);
  if (cached) return cached;

  // no cache
  const { osmData, query } =
    source === 'postpass'
      ? await fetchFromPostpass(bbox)
      : await fetchFromOverpass(bbox);

  const cache: Cache = {
    source,
    query,
    date: new Date().toISOString(),
    osmData,
  };
  await set(CACHE_PREFIX + cacheKey, cache);

  return cache;
}

export const clearOsmCache = (cacheKey: string) => del(CACHE_PREFIX + cacheKey);

export async function hasOsmCache(cacheKey: string) {
  const cachedKeys = await keys();
  return cachedKeys.includes(CACHE_PREFIX + cacheKey);
}
