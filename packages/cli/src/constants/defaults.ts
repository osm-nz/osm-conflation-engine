import type { Config } from '../types/config.def.js';

/** if a feature was last edited within this many DAYS, then it's "recently edited" */
export const RECENT_THRESHOLD = 90;

/** can be overriden by the config */
export const DEFAULT_SECTOR_RESOLUTION = 3;

export const IS_UNIT_TEST = process.env.NODE_ENV === 'test';

/**
 * this is not a hard minimum, if a dataset has fewer than this number,
 * we will try to merge it into the nearest datasets in the same sector.
 */
// TODO: make configurable
export const MIN_ITEMS_PER_DATASET = 40;
export const MAX_ITEMS_PER_DATASET = 110;

/** can be customised in the config */
export const CHECK_DATE_KEY = 'check_date';

export const STEPS = <const>['download', 'match', 'conflate'];
export type Step = (typeof STEPS)[number];

export const FILE_NAMES = <const>{
  // o_data
  PBF: 'o.pbf',
  OVERPASS: 'o.geo.json',
  POSTPASS: 'o.geo.json',
  OSM_PROCESSED_WITH_REF: 'osm-processed-with-ref.jsonl',
  OSM_PROCESSED_NO_REF: 'osm-processed-no-ref.jsonl',
  OSM_PROCESSED_OTHER: 'osm-processed-other.json',

  // source data

  // other data
  IGNORE_LIST: 'ignore-list.json',

  // matched
  MATCHES: 'matches.json',
};
export type FileNames = keyof typeof FILE_NAMES;

export const API_BASE_URL = 'https://osm-conflation-engine.kyle.kiwi';
export const REPO_URL = 'https://github.com/osm-nz/osm-conflation-engine';

export const getHttpHeaders = (config: Config) => ({
  'User-Agent': `${REPO_URL} on behalf of ${config.metadata.wiki_page}`,
});
