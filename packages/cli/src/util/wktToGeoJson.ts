import type { Geometry, GeometryCollection } from 'geojson';
import type { Vec2 as Coord } from '@osm-conflation-engine/cli';
import { IS_UNIT_TEST } from '../constants/defaults.js';
import { simplify } from './simplify-geometry.js';
import { chunk } from './object.js';

/** point | line | area/multipolygon-with-1-outer-way | mutlipolygon with multiple outer ways */
type CoordArray = Coord | Coord[] | Coord[][] | Coord[][][];

const TYPES = <const>{
  // the maritime layers sometimes have Z
  POINT: 'Point',
  'POINT Z': 'Point',
  MULTIPOINT: 'MultiPoint',
  'MULTIPOINT Z': 'MultiPoint',
  LINESTRING: 'LineString',
  'LINESTRING Z': 'LineString',
  MULTILINESTRING: 'MultiLineString',
  'MULTILINESTRING Z': 'MultiLineString',
  POLYGON: 'Polygon',
  'POLYGON Z': 'Polygon',
  MULTIPOLYGON: 'MultiPolygon',
  'MULTIPOLYGON Z': 'MultiPolygon',
};

/** from https://api.openstreetmap.org/api/0.6/capabilities */
const MAX_WAY_LENGTH = IS_UNIT_TEST ? 6 : 2000;
/**
 * if we have to split a way >MAX_WAY_LENGTH, we will create several chunks
 * of this length. See opennewzealand/linz2osm#10 for why we use 495
 * https://github.com/opennewzealand/linz2osm/issues/10
 */
const CHUNKED_WAY_LENGTH = IS_UNIT_TEST ? 4 : 495;

/** tolerance for https://mourner.github.io/simplify-js */
const WAY_SIMPLIFICATION = 0.00003;

const correctLng = (point: Coord): Coord => {
  // we could do `((lng + 180) % 360) - 180` but this is computationally cheaper
  if (point[0] < 180) return point;
  return [point[0] - 360, point[1]];
};

/** LINZ's data uses longitude values that are >180, see issue osm-nz/linz-address-import#2 */
const fixAntiMeridian = (coords: CoordArray): CoordArray => {
  if (typeof coords[0] === 'number') return correctLng(coords as Coord);
  if (typeof coords[0][0] === 'number') {
    return (coords as Coord[]).map(correctLng);
  }
  if (typeof coords[0][0][0] === 'number') {
    return (coords as Coord[][]).map((ring) => ring.map(correctLng));
  }
  if (typeof coords[0][0][0][0] === 'number') {
    return (coords as Coord[][][]).map((segment) =>
      segment.map((ring) => ring.map(correctLng)),
    );
  }
  return coords; // will never happen
};

export namespace wktToGeoJson {
  export interface Options {
    /**
     * if true, longitudes >180 will be replaced with valid modulo'd values
     * @default false
     */
    shouldFixAntiMeridian?: boolean;

    /**
     * if true, excessive coordinate precision will be removed
     * @default false
     */
    shouldSimplify?: boolean;

    /**
     * if true, LineStrings are reversed
     * @default false
     */
    flipWays?: boolean;

    /**
     * if true, warnings about invalid geometry will not be logged
     * @default false
     */
    silenceWarnings?: boolean;
  }
}

/**
 * Converts {@link https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry WKT} to geojson
 */
export function wktToGeoJson(
  wkt: string,
  {
    shouldFixAntiMeridian,
    shouldSimplify,
    flipWays,
    silenceWarnings,
  }: wktToGeoJson.Options = {},
): Exclude<Geometry, GeometryCollection> {
  let type = TYPES[wkt.match(/^\w+( Z)?/)![0] as keyof typeof TYPES];

  let coordinates = JSON.parse(
    wkt
      .replace(/^\w+( Z)? /, '')
      .replaceAll('(', '[')
      .replaceAll(')', ']')
      .replaceAll(
        /(([\d.-])+) (([\d.-])+)( 0)?/g, // matches `174.123 -36.456` maybe with ` 0` at the end
        (_0, lng, _1, lat) => `[${lng},${lat}]`,
      ),
  );

  if (type === 'Point') [coordinates] = coordinates; // fix double bracket

  // simplify MultiLineStrings that only have one member
  if (type === 'MultiLineString' && coordinates.length === 1) {
    type = 'LineString';
    [coordinates] = coordinates;
  }

  // simplify MultiPoints that only have one member
  if (
    type === 'MultiPoint' &&
    coordinates.length === 1 &&
    coordinates[0].length === 1
  ) {
    type = 'Point';
    [[coordinates]] = coordinates;
  }

  if (type === 'MultiLineString' || type === 'MultiPoint') {
    throw new Error(`Cannot handle complex ${type}`);
  }

  // simplify multipolygons that only have one member (the outer way)
  if (
    type === 'MultiPolygon' &&
    coordinates.length === 1 &&
    coordinates[0].length === 1
  ) {
    type = 'Polygon';
    [coordinates] = coordinates;
  }

  if (shouldSimplify) {
    switch ('number') {
      case typeof coordinates[0]: {
        // point, nothing to do

        break;
      }
      case typeof coordinates[0][0]: {
        coordinates = simplify(coordinates, WAY_SIMPLIFICATION);

        break;
      }
      case typeof coordinates[0][0][0]: {
        coordinates = coordinates.map((c: Coord[]) =>
          simplify(c, WAY_SIMPLIFICATION),
        );

        break;
      }
      case typeof coordinates[0][0][0][0]: {
        coordinates = coordinates.map((c1: Coord[][]) =>
          c1.map((c2) => simplify(c2, WAY_SIMPLIFICATION)),
        );

        break;
      }
      default: {
        throw new Error('impossible');
      }
    }
  }

  // coastline, cliff, emabankment, landslide, antarctic_depForm,
  // were all facing the wrong way, so we reverse the way
  // BUT water_race, ice_stream, melt_stream need to remain in their original direction!
  if (type === 'LineString' && flipWays) {
    coordinates.reverse();
  }

  // RapiD doesn't support multipolygons of unclosed ways yet.
  if (type === 'LineString' && coordinates.length > MAX_WAY_LENGTH) {
    console.warn(`has a way with >${MAX_WAY_LENGTH} nodes`);
  }

  // convert huge Polygons into MultiPolygons with multiple outer ways
  if (
    type === 'Polygon' &&
    coordinates.some((c: number[]) => c.length > MAX_WAY_LENGTH)
  ) {
    type = 'MultiPolygon';
    const [outer, ...inner] = coordinates;

    const newOuterWays: Coord[][] = chunk<Coord>(outer, CHUNKED_WAY_LENGTH);
    const newInnerWays: Coord[][] = [];
    for (const ring of inner) {
      newInnerWays.push(...chunk<Coord>(ring, CHUNKED_WAY_LENGTH));
    }
    coordinates = newOuterWays.map((C) => [C]);
    coordinates[0].push(...newInnerWays);
  } else if (
    type === 'MultiPolygon' &&
    coordinates.some((c: number[][]) =>
      c.some((cc) => cc.length > MAX_WAY_LENGTH),
    ) &&
    !silenceWarnings
  ) {
    // this is non trivial to fix
    console.warn(`has a MultiPolygon with >${MAX_WAY_LENGTH} nodes`);
  }

  // for performance reasons, only apply this to hydrographic layers
  if (shouldFixAntiMeridian) {
    coordinates = fixAntiMeridian(coordinates);
  }

  return { type, coordinates };
}
