import type { OsmFeature } from 'osm-api';
import { del, get, set } from 'idb-keyval';
import type { BBox } from '../types/config.def.js';
import query from './query.sql?raw';

interface PostpassResponse {
  result: { element: OsmFeature }[];
}

export async function fetchFromPostpass(bbox: BBox, cacheKey: string) {
  // pad the bbox by a few hundred metres so that the cornermost nodes
  // are not cut-off.
  const bboxString = [
    bbox.minLon - 0.01,
    bbox.minLat - 0.01,
    bbox.maxLon + 0.01,
    bbox.maxLat + 0.01,
  ].join(',');

  const finalQuery = query.replaceAll('{{bbox}}', bboxString);

  const cache = await get<OsmFeature[]>(cacheKey);
  if (cache) return { osmData: cache, query: finalQuery };

  const response = await fetch(
    'https://postpass.geofabrik.de/api/interpreter',
    {
      method: 'POST',
      body: new URLSearchParams({
        data: finalQuery,
        'options[geojson]': 'false',
      }),
    },
  );
  if (!response.ok) {
    const status = (await response.text()) || response.statusText;
    throw new Error(`HTTP Error ${response.status} ${status}`);
  }

  const json: PostpassResponse = await response.json();
  const osmData = json.result.map((row) => row.element);

  await set(cacheKey, osmData);

  return { osmData, query: finalQuery };
}

export const clearPostpassCache = (cacheKey: string) => del(cacheKey);
