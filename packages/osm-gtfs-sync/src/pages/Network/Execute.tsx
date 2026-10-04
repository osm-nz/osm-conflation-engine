import { memo, useEffect, useRef, useState } from 'react';
import { MapContainer, Rectangle, TileLayer } from 'react-leaflet';
import { CommsChannel, deleteDatabase } from 'gtfs-sqlite';
import { type ConflationResult, conflate } from '../../conflate/index.js';
import type { NetworkConfig } from '../../types/config.def.js';
import { OSM_SOURCES, type OsmSource, clearOsmCache } from '../../api/osm.js';
import { bboxToCentroid } from '../../helpers/geo.js';
import { ProgressBar } from '../../components/ProgressBar.js';
import { downloadBlob } from '../../helpers/js.js';
import { RenderStops } from './Results/RenderStops.js';
import { RenderStations } from './Results/RenderStations.js';
import { RenderRoutes } from './Results/RenderRoutes.js';
import 'leaflet/dist/leaflet.css';

export const Execute = memo<{
  network: NetworkConfig;
  reloadDBList(): void;
}>(({ network, reloadDBList }) => {
  const [result, setResult] = useState<ConflationResult>();
  const [error, setError] = useState<Error>();
  const inflightRef = useRef<Promise<void>>(undefined);

  const [osmSource, setOsmSource] = useState(() => localStorage.gtfsOsmSource);
  useEffect(() => {
    localStorage.gtfsOsmSource = osmSource;
  }, [osmSource]);

  const [key, setKey] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    inflightRef.current ||= conflate(
      network,
      setResult,
      controller.signal,
      osmSource,
    )
      .then(() => {
        inflightRef.current = undefined;
      })
      .catch(setError);

    return () => {
      controller.abort();
      inflightRef.current = undefined;
    };
  }, [key, network, osmSource]);

  if (error) {
    console.error(error);
    return <>Error {`${error}`}</>;
  }

  const eitherBbox = network.bbox || result?.bbox;
  const centroid = eitherBbox && bboxToCentroid(eitherBbox);

  return (
    <>
      {result ? (
        <>
          {result.isComplete ? 'Done!' : result.message}
          <h1>Overview</h1>
          <ul>
            {result.stops && (
              <li>
                <ProgressBar count={result.stops.count} /> Stops
              </li>
            )}
            {result.stations && (
              <li>
                <ProgressBar count={result.stations.count} /> Stations
              </li>
            )}
            {result.routes && (
              <li>
                <ProgressBar count={result.routes.count} /> Routes
              </li>
            )}
          </ul>

          <h1>Stops</h1>
          {result.stops ? (
            <RenderStops data={result.stops} />
          ) : (
            'Not started yet.'
          )}
          <h1>Stations</h1>
          {result.stations ? (
            <RenderStations data={result.stations} />
          ) : (
            'Not started yet.'
          )}
          <h1>Routes</h1>
          {result.routes && result.stops ? (
            <RenderRoutes
              data={result.routes}
              gtfsRouteData={result.stops.gtfsRouteData}
            />
          ) : (
            'Not started yet.'
          )}
        </>
      ) : (
        'Waiting for first update'
      )}
      <hr />
      Update data:
      <button
        type="button"
        onClick={async () => {
          // eslint-disable-next-line no-alert, no-restricted-globals -- temp
          if (!confirm('sure?')) return;

          try {
            await deleteDatabase(network.code);
            reloadDBList();
          } catch (ex) {
            console.error(ex);
            // eslint-disable-next-line no-alert
            alert('Failed to delete');
          }
        }}
      >
        Re-upload GTFS file
      </button>
      <button
        type="button"
        onClick={() => {
          clearOsmCache(osmSource, network.code);
          setKey((c) => c + 1);
        }}
        disabled={!!inflightRef.current}
      >
        Re-fetch from OSM
      </button>
      <label>
        {' '}
        via{' '}
        <select
          value={osmSource}
          onChange={(event) => setOsmSource(event.target.value as OsmSource)}
        >
          {OSM_SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </select>{' '}
      </label>
      <button
        type="button"
        onClick={async () => {
          const comms = CommsChannel(network.code);
          const blobUrl = await comms.dump();
          downloadBlob(`${network.networkName}.sqlite3`, blobUrl);
        }}
        disabled={!!inflightRef.current}
      >
        Export sqlite3 DB dump
      </button>
      {centroid && (
        <MapContainer
          style={{ width: '50vw', height: '50vw' }}
          center={[centroid.lat, centroid.lon]}
          zoom={6}
        >
          <TileLayer
            crossOrigin
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {network.bbox && (
            <Rectangle
              bounds={[
                [network.bbox.minLat, network.bbox.minLon],
                [network.bbox.maxLat, network.bbox.maxLon],
              ]}
              pathOptions={{ color: 'teal' }}
            />
          )}
          {result?.bbox && (
            <Rectangle
              bounds={[
                [result.bbox.minLat, result.bbox.minLon],
                [result.bbox.maxLat, result.bbox.maxLon],
              ]}
              pathOptions={{ color: 'pink' }}
            />
          )}
        </MapContainer>
      )}
      <span style={{ color: 'pink' }}>Pink</span> = extent of the GTFS data{' '}
      <br />
      <span style={{ color: 'teal' }}>Teal</span> = custom extent used by this
      tool.
    </>
  );
});

Execute.displayName = 'Execute';
