import maplibregl from 'maplibre-gl';
import type {
  Feature,
  GeoJsonProperties,
  Geometry,
  Point,
  Position,
} from 'geojson';

export function calcBBox(geometries: Geometry[]) {
  const bbox = {
    minLat: Infinity,
    minLng: Infinity,
    maxLat: -Infinity,
    maxLng: -Infinity,
    // to make it more convenient for datasets that span the antimeridian
    minLng360: Infinity,
    maxLng360: -Infinity,
  };

  function visit([_lng, _lat]: Position) {
    const lat = +_lat!;
    const lng = +_lng!;
    const lng360 = lng < 0 ? 360 + lng : lng;
    if (lat < bbox.minLat) bbox.minLat = lat;
    if (lng < bbox.minLng) bbox.minLng = lng;
    if (lat > bbox.maxLat) bbox.maxLat = lat;
    if (lng > bbox.maxLng) bbox.maxLng = lng;
    if (lng360 < bbox.minLng360) bbox.minLng360 = lng360;
    if (lng360 > bbox.maxLng360) bbox.maxLng360 = lng360;
  }

  /* eslint-disable unicorn/no-array-for-each -- deliberate */

  for (const geometry of geometries) {
    switch (geometry.type) {
      case 'Point': {
        visit(geometry.coordinates);

        break;
      }

      case 'MultiPoint':
      case 'LineString': {
        geometry.coordinates.forEach(visit);

        break;
      }
      case 'MultiLineString':
      case 'Polygon': {
        for (const ring of geometry.coordinates) ring.forEach(visit);

        break;
      }
      case 'MultiPolygon': {
        for (const member of geometry.coordinates) {
          for (const ring of member) ring.forEach(visit);
        }
        break;
      }

      default:
      // other geometry types are allowed, they just won't
      // count towards the bbox
    }
  }

  if (bbox.minLng === Infinity) return undefined;

  const isPacificOcean =
    bbox.maxLng360 - bbox.minLng360 < bbox.maxLng - bbox.minLng;

  return new maplibregl.LngLatBounds(
    [isPacificOcean ? bbox.minLng360 : bbox.minLng, bbox.minLat],
    [isPacificOcean ? bbox.maxLng360 : bbox.maxLng, bbox.maxLat],
  );
}

export function getCentroid<T extends GeoJsonProperties>(
  feature: Feature<Geometry, T>,
): Feature<Point, T & { centroid: true }> | undefined {
  const centre = calcBBox([feature.geometry]);
  if (!centre) return undefined;

  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: centre.getCenter().toArray() },
    properties: { ...feature.properties, centroid: true },
  };
}
