import { CommsChannel } from 'gtfs-sqlite';
import { LocationType } from 'gtfs-types';
import type { ConflateResult } from '@osm-conflation-engine/cli';
import { type OsmSource, fetchOsmData } from '../api/osm.js';
import type { BBox, NetworkConfig } from '../types/config.def.js';
import type { Count } from '../types/general.def.js';
import { writeToRunHistory } from '../api/conflation.ts';
import { MatchType } from '../types/shared.def.ts';
import { conflateStops } from './conflateStops.js';
import { conflateStations } from './conflateStations.js';
import { conflateRoutes } from './conflateRoutes.js';

/** exact copy of defaults.ts */
export const RECENT_THRESHOLD = 90;
const thresholdDate = new Date();
thresholdDate.setDate(thresholdDate.getDate() - RECENT_THRESHOLD);

export interface ConflationResult {
  isComplete: boolean;
  message: string;
  bbox?: BBox;
  stops?: Awaited<ReturnType<typeof conflateStops>>;
  stations?: Awaited<ReturnType<typeof conflateStations>>;
  routes?: Awaited<ReturnType<typeof conflateRoutes>>;
}

export async function conflate(
  config: NetworkConfig,
  onProgress?: (result: ConflationResult) => void,
  signal?: AbortSignal,
  osmSource: OsmSource = 'overpass',
  storeResults = true,
) {
  const result: ConflationResult = {
    isComplete: false,
    message: 'connecting to sqlite database in the WebWorker…',
  };
  onProgress?.(result);
  const log = (message?: string) => {
    if (message) {
      console.info(message);
      result.message = message;
    }

    if (signal?.aborted) return; // don't send any updates if aborted

    // clone every time to ensure reactive frameworks detect the change
    onProgress?.(structuredClone(result));
  };

  const comms = CommsChannel(config.code);

  // just to test that the sqlite WebWorker connection is working, before
  // attempting to do a SQL query. The result is discarded
  await comms.getVersion();

  log('Calculating Bbox from GTFS stops...');
  const [bbox] = await comms.exec<BBox>(
    'SELECT min(stop_lat) minLat, max(stop_lat) maxLat, min(stop_lon) minLon, max(stop_lon) maxLon FROM stops',
  );
  result.bbox = bbox;
  if (signal?.aborted) return;

  // @ts-expect-error -- TODO: temp for experimenting
  window.comms = comms;

  log(`Fetching OSM data from ${osmSource}...`);
  const { osmData, query, source } = await fetchOsmData(
    osmSource,
    config.bbox || bbox,
    config.code,
  );
  if (signal?.aborted) return;

  // @ts-expect-error -- TODO: temp for experimenting
  window.osmData = osmData;

  log('conflating stops...');
  result.stops = await conflateStops(config, osmData, comms);
  if (signal?.aborted) return;

  log('conflating stations...');
  result.stations = await conflateStations(config, osmData, comms);
  if (signal?.aborted) return;

  log('conflating routes...');
  result.routes = await conflateRoutes(config, osmData, comms, result);
  if (signal?.aborted) return;

  result.isComplete = true;
  if (!storeResults) {
    log('done!');
    return;
  }

  log('saving progress update...');
  const layers = [result.stops, result.stations, result.routes];
  const sum = (key: keyof Count) =>
    layers.reduce((total, layer) => total + layer.count[key], 0);

  const create = sum('add');
  const edit = sum('edit');
  const ignored = sum('skipped');
  const total = sum('total');
  const perfect = total - create - edit - ignored;

  let lastEditedByImporter = 0;
  let recentlyChanged = 0;
  for (const feature of osmData) {
    if (feature.user?.endsWith('_import')) lastEditedByImporter++;
    if (+new Date(feature.timestamp) > +thresholdDate) recentlyChanged++;
  }

  // try to get a count of stops+stations+routes that is roughly similar
  // to the OSM matching logic.
  const cols = await comms.getColumns('stops');
  const stopFilter = cols.has('location_type')
    ? `WHERE s.location_type IS NULL OR s.location_type IN ('${LocationType.STOP}', '${LocationType.STATION}', '')`
    : '';
  const [{ count: gtfsCount }] = await comms.exec<{ count: number }>(`
    SELECT
      (SELECT COUNT(*) FROM stops s ${stopFilter}) +
      (SELECT COUNT(DISTINCT route_short_name) FROM routes)
      AS count
  `);

  // this is a mock config, just to satisfy the format required by the API
  const metrics: ConflateResult = {
    config: {
      $schema:
        'https://unpkg.com/@osm-conflation-engine/cli/dist/config.schema.json',
      metadata: {
        name: `Public Transport — ${config.networkName}`,
        description: `GTFS data in ${config.code}`,
        region: config.region,
        wiki_page: `https://www.wikidata.org/wiki/${config.networkWikidata}#P8253`,
      },
      merge: {
        dataset_column: '',
        osm_key: `network:wikidata=${config.networkWikidata}`,
      },
      osm_data: {
        tags_to_keep: [],
        source:
          source === 'postpass'
            ? { type: 'postpass', postpass_query_file: query }
            : { type: 'overpass', overpass_query_file: query },
      },
      source_data: {
        type: 'file',
        file: config.gtfsSource.url,
      },
    },
    warnings: layers.flatMap((layer) => [...layer.warnings]),
    countsByPhase: {
      init: {
        ignored,
        osm: {
          duplicateRefs: 0,
          lastEditedByImporter,
          noRef: 0,
          recentlyChanged,
          recentlyChecked: 0,
          semi: 0,
          withRef: total,
        },
        sourceDataset: gtfsCount,
      },
      conflated: {
        create,
        delete: 0,
        edit,
        perfect,
      },
      matched: {
        [MatchType.OneToOne]: edit + perfect,
        [MatchType.OneToMany]: 0,
        [MatchType.ManyToOne]: 0,
        [MatchType.ManyToMany]: 0,
        [MatchType.Delete]: 0,
        [MatchType.Guess]: create,
      },
    },
  };
  await writeToRunHistory(config.code, metrics);

  log('done!');
}
