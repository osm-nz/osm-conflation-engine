import { memo } from 'react';
import { MapContainer, Rectangle, TileLayer } from 'react-leaflet';
import { CommsChannel } from 'gtfs-sqlite';
import type { ConflationResult } from '../../conflate/index.js';
import type { NetworkConfig } from '../../types/config.def.js';
import { bboxToCentroid } from '../../helpers/geo.js';
import { ProgressBar } from '../../components/ProgressBar.js';
import { downloadBlob } from '../../helpers/js.js';
import { RenderStops } from './Results/RenderStops.js';
import { RenderStations } from './Results/RenderStations.js';
import { RenderRoutes } from './Results/RenderRoutes.js';
import 'leaflet/dist/leaflet.css';

export const Review = memo<{
  network: NetworkConfig;
  result: ConflationResult;
}>(({ network, result }) => {
  const eitherBbox = network.bbox || result.bbox;
  const centroid = eitherBbox && bboxToCentroid(eitherBbox);

  return (
    <>
      Done!
      <h1>Overview</h1>
      <table>
        <tbody>
          {result.stops && (
            <tr>
              <td style={{ paddingRight: 8 }}>Stops</td>
              <td style={{ width: '100%' }}>
                <ProgressBar count={result.stops.count} />
              </td>
            </tr>
          )}
          {result.stations && (
            <tr>
              <td style={{ paddingRight: 8 }}>Stations</td>
              <td style={{ width: '100%' }}>
                <ProgressBar count={result.stations.count} />
              </td>
            </tr>
          )}
          {result.routes && (
            <tr>
              <td style={{ paddingRight: 8 }}>Routes</td>
              <td style={{ width: '100%' }}>
                <ProgressBar count={result.routes.count} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <h1>Stops</h1>
      {result.stops ? <RenderStops data={result.stops} /> : 'Not started yet.'}
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
      <hr />
      <button
        type="button"
        onClick={async () => {
          const comms = CommsChannel(network.code);
          const blobUrl = await comms.dump();
          downloadBlob(`${network.networkName}.sqlite3`, blobUrl);
        }}
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
          {result.bbox && (
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

Review.displayName = 'Review';
