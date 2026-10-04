import type { BBox } from '../types/config.def.js';
import { clearOverpassCache, fetchFromOverpass } from './overpass.js';
import { clearPostpassCache, fetchFromPostpass } from './postpass.js';

export const OSM_SOURCES = ['overpass', 'postpass'] as const;
export type OsmSource = (typeof OSM_SOURCES)[number];

export async function fetchOsmData(
  source: OsmSource,
  bbox: BBox,
  cacheKey: string,
) {
  return source === 'postpass'
    ? fetchFromPostpass(bbox, cacheKey + source)
    : fetchFromOverpass(bbox, cacheKey + source);
}

export function clearOsmCache(source: OsmSource, cacheKey: string) {
  return source === 'postpass'
    ? clearPostpassCache(cacheKey + source)
    : clearOverpassCache(cacheKey + source);
}
