import type { Polygon } from 'geojson';
import type { BBox } from '../types/internal.def.js';

export function bboxToPolygon({
  minLng,
  minLat,
  maxLng,
  maxLat,
}: BBox): Polygon {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [minLng, minLat], // SW
        [maxLng, minLat], // SE
        [maxLng, maxLat], // NE
        [minLng, maxLat], // NW
        [minLng, minLat], // SW
      ],
    ],
  };
}
