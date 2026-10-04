import type { OsmFeature } from 'osm-api';
import type { BBox } from '../types/config.def.js';
import query from './query.overpassql?raw';

export async function fetchFromOverpass(bbox: BBox) {
  // pad the bbox by a few hundred metres so that the cornermost nodes
  // are not cut-off.
  const bboxString = [
    bbox.minLat - 0.01,
    bbox.minLon - 0.01,
    bbox.maxLat + 0.01,
    bbox.maxLon + 0.01,
  ].join(',');

  const finalQuery = query.replaceAll('{{bbox}}', bboxString);

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
    finalQuery,
  )}`;
  const osmData: OsmFeature[] = await fetch(url)
    .then((r) => r.json())
    .then((resp) => resp.elements);

  return { osmData, query: finalQuery };
}
