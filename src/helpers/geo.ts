//
// copied from the linz-address-import repo
//

import type { BBox } from '../types/config.def';

const { sin, cos, sqrt, PI: π, atan2 } = Math;

const R = 6371; // radius of the earth in km

/** deg to rad */ const rad = (d: number) => d * (π / 180);
/** rad to deg */ const deg = (r: number) => r * (180 / π);

/** returns the distance in metres between two coordinates */
export function distanceBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const ΔLat = rad(lat2 - lat1);
  const ΔLon = rad(lng2 - lng1);
  const a =
    sin(ΔLat / 2) * sin(ΔLat / 2) +
    cos(rad(lat1)) * cos(rad(lat2)) * sin(ΔLon / 2) * sin(ΔLon / 2);
  const c = 2 * atan2(sqrt(a), sqrt(1 - a));
  return 1000 * R * c;
}

export function bboxToCentroid(bbox: BBox) {
  return {
    lat: bbox.minLat + (bbox.maxLat - bbox.minLat) / 2,
    lon: bbox.minLon + (bbox.maxLon - bbox.minLon) / 2,
  };
}

export function isInBbox(bbox: BBox, lat: number, lon: number) {
  return (
    lat > bbox.minLat &&
    lat < bbox.maxLat &&
    lon > bbox.minLon &&
    lon < bbox.maxLon
  );
}

export function getBearingBetweenCoords(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const [y1, x1, y2, x2] = [lat1, lon1, lat2, lon2].map(rad);

  const x = cos(y2) * sin(x2 - x1);
  const y = cos(y1) * sin(y2) - sin(y1) * cos(y2) * cos(x2 - x1);

  const θ = atan2(x, y);

  return (deg(θ) + 360) % 360;
}
