import type { BBox, CoordKey } from '../types/internal.def.js';

/**
 * converts a coordinate into a string key, for more performant
 * deduplication. 5dp = accurate to the nearest 1m, see
 * https://osm.wiki/Precision_of_coordinates
 */
export const getCoordKey = (lat: number, lon: number, accuraryDp = 5) =>
  <CoordKey>`${lat.toFixed(accuraryDp)},${lon.toFixed(accuraryDp)}`;

/** metres */
export const EARTH_RADIUS = 6371008.8;

/** @returns the distance (in degrees) between the closest two points of the two bboxes */
export function distanceBetweenBboxes(a: BBox, b: BBox) {
  const Δlat = Math.max(0, b.minLat - a.maxLat, a.minLat - b.maxLat);
  const Δlon = Math.max(0, b.minLng - a.maxLng, a.minLng - b.maxLng);
  return Math.hypot(Δlat, Δlon);
}

/** returns the larger of lat or lon */
export function getBboxMaxDimension(bbox: BBox) {
  return Math.max(
    Math.abs(bbox.maxLat - bbox.minLat),
    Math.abs(bbox.maxLng - bbox.minLng),
  );
}
