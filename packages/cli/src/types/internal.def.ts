import type { OsmPatchFeature, Tags } from 'osm-api';
import type { GeoJsonProperties, Geometry } from 'geojson';
import type { FileNames } from '../constants/defaults.js';
import type {
  Callbacks,
  DatasetId,
  OsmFeature,
  OsmId,
  SourceDataFeature,
} from './callbacks.def.js';
import type { Config } from './config.def.js';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'test';
      OSM_AUTH?: string;
    }
  }
}

export interface Ctx<
  G extends Geometry = Geometry,
  P extends GeoJsonProperties = GeoJsonProperties,
> {
  use_cache: boolean;
  id: string;
  tempFolder: string;
  tempFileNames: Record<Lowercase<FileNames>, string>;
  config: Config;
  callbacks: Callbacks<G, P>;
  warnings: string[];
}

export interface SourceData<
  G extends Geometry = Geometry,
  P extends GeoJsonProperties = GeoJsonProperties,
> {
  [datasetId: DatasetId]: SourceDataFeature<G, P>;
}

export enum CheckDate {
  No,
  YesRecent, // check_date is recent (less than X years ago)
  YesExpired, // check_date is older than X years
}

export interface OSMData {
  withRef: {
    [datasetId: DatasetId]: OsmFeature;
  };
  /** IDs that exist on multiple osm features */
  duplicateRefs: {
    [datasetId: DatasetId]: OsmFeature[];
  };
  /** osm features where the ref tag has a semicolon-delimited primary key tag */
  semi: {
    [datasetId: DatasetId]: OsmFeature;
  };
  noRef: {
    [osmId: OsmId]: OsmFeature;
  };
  /** the number of features in OSM with the `ref:*` tag */
  count: number;
}

/**
 * `source:o`. this only describes the mapping between the two datasets.
 * This mapping is orthogonal to whether the tags are correct. That is
 * checked at a later stage.
 */
export enum MatchType {
  OneToOne = 1,
  OneToMany = 2,
  ManyToOne = 3,
  ManyToMany = 4,
  /** 0:1 */
  Delete = 5,
  /** `1:unknown` there is no match, so we have guessed, and found some potential matches. */
  Guess = 6,
}

/** `source:o` */
export interface MatchOutput {
  [MatchType.OneToOne]: { source: DatasetId; osm: OsmId }[];
  [MatchType.OneToMany]: { source: DatasetId; osm: OsmId[] }[];
  [MatchType.ManyToOne]: { [osmId: OsmId]: DatasetId[] };
  [MatchType.ManyToMany]: { source: DatasetId[]; osm: OsmId[] }[];
  [MatchType.Delete]: DatasetId[];
  [MatchType.Guess]: { source: DatasetId; osmCandidates: OsmId[] }[];
}

export type BBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export interface OutputLayer {
  features: OsmPatchFeature[];
  bbox: BBox;
  sectorIds: string[];
  instructions?: string;
  changesetTags?: Tags;
}

export interface HandlerReturnWithBBox {
  [sectorName: string]: OutputLayer;
}

export interface OutputLayers {
  [categoryName: string]: {
    [sectorName: string]: OutputLayer;
  };
}

export type CoordKey = `${number},${number}`;
