import type { Geometry } from 'geojson';
import {
  POLYGON_TO_CELLS_FLAGS,
  latLngToCell,
  polygonToCellsExperimental,
} from 'h3-js';
import { DEFAULT_SECTOR_RESOLUTION } from '../constants/defaults.js';

/** converts geojson geometry into a sorted list of h3 grids. */
export function getSector(
  geometry: Geometry,
  _resolution: number | undefined,
): string[] {
  const resolution = _resolution || DEFAULT_SECTOR_RESOLUTION;
  switch (geometry.type) {
    case 'GeometryCollection': {
      throw new Error('not supported');
    }

    case 'Point': {
      return [
        latLngToCell(
          geometry.coordinates[1]!,
          geometry.coordinates[0]!,
          resolution,
        ),
      ];
    }
    case 'MultiPoint':
    case 'LineString':
    case 'MultiLineString':
    case 'Polygon': {
      return polygonToCellsExperimental(
        geometry.coordinates,
        resolution,
        POLYGON_TO_CELLS_FLAGS.containmentOverlapping,
        true,
      ).toSorted();
    }

    case 'MultiPolygon': {
      const grids = new Set<string>();
      for (const ring of geometry.coordinates) {
        const newGrids = polygonToCellsExperimental(
          ring,
          resolution,
          POLYGON_TO_CELLS_FLAGS.containmentOverlapping,
          true,
        );
        for (const grid of newGrids) grids.add(grid);
      }
      return [...grids].toSorted();
    }

    default: {
      throw new TypeError(geometry satisfies never);
    }
  }
}
