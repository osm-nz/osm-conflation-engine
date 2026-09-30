import { CommsChannel } from 'gtfs-sqlite';
import { fetchFromOverpass } from '../api/overpass.js';
import type { BBox, NetworkConfig } from '../types/config.def.js';
import { conflateStops } from './conflateStops.js';
import { conflateStations } from './conflateStations.js';
import { conflateRoutes } from './conflateRoutes.js';

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

  const comms = CommsChannel(config.networkWikidata);

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

  log('Fetching OSM data from overpass...');
  const osmData = await fetchFromOverpass(
    config.bbox || bbox,
    config.networkWikidata,
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
  log('done!');
}
