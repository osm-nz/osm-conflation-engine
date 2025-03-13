import { GTFSBool, VehicleType } from 'gtfs-types';
import { getOkayCount } from '../../../components/ProgressBar';
import type { ConflationResult } from '../../../conflate';
import type { FinalGTFSOutput } from '../../../conflate/conflateStops';
import { createBlob } from '../../../helpers/js';
import { Warnings } from './Warnings';

export const RenderDuration: React.FC<{
  durations: number[];
}> = ({ durations }) => {
  const set = new Set(durations);

  if (set.size === 1) return <>{Math.round(durations[0] / 60)}mins</>;

  const min = Math.min(...durations);
  const max = Math.max(...durations);
  return (
    <>
      {(min / 60) | 0}-{(max / 60) | 0}mins
    </>
  );
};

export const RenderRoutes: React.FC<{
  data: NonNullable<ConflationResult['routes']>;
  gtfsRouteData: FinalGTFSOutput;
}> = ({ data, gtfsRouteData }) => {
  return (
    <>
      <a
        href={createBlob(data.osmPatch.add)}
        download="routes-add.osmPatch.geo.json"
      >
        {data.osmPatch.add.features.length.toLocaleString()} missing
      </a>
      ,{' '}
      <a
        href={createBlob(data.osmPatch.edit)}
        download="routes-wrong.osmPatch.geo.json"
      >
        {data.osmPatch.edit.features.length.toLocaleString()} wrong
      </a>
      , {getOkayCount(data.count).toLocaleString()} are okay. And{' '}
      <a
        href={createBlob(data.osmPatch.routeMaster)}
        download="route-master.osmPatch.geo.json"
      >
        {data.osmPatch.routeMaster.features.length.toLocaleString()} issues with
        route_master relations
      </a>
      .
      <Warnings warnings={data.warnings} />
      <ul>
        {Object.values(gtfsRouteData).map((route) => {
          return (
            <li
              key={route.rsn}
              style={
                route.ignore
                  ? { textDecoration: 'line-through', color: '#999' }
                  : {}
              }
            >
              {['❓', '1️⃣', '2️⃣'][route.match?.PTv ?? 0]}
              {VehicleType[route.vehicleType]?.toLowerCase()}{' '}
              <a
                href={
                  route.match && `https://osm.org/relation/${route.match.rId}`
                }
                target="_blank"
              >
                <span
                  style={{
                    background: route.colour ? `#${route.colour}` : '#333',
                    color: 'white',
                  }}
                >
                  {route.rsn}
                </span>{' '}
                {route.rln}
              </a>
              <ul>
                {route.journeys.map((journey) => (
                  <li
                    key={journey.tripIds[0]}
                    style={
                      journey.keep
                        ? {}
                        : { textDecoration: 'line-through', color: '#999' }
                    }
                  >
                    <a
                      href={
                        journey.match &&
                        `https://osm.org/relation/${journey.match.rId}`
                      }
                      target="_blank"
                    >
                      {journey.tripIds.length} to{' '}
                    </a>
                    {[...journey.headsigns].join(' / ')}{' '}
                    {journey.wheelchair.has(GTFSBool.YES) ? '♿️' : ''}
                    {journey.wheelchair.has(GTFSBool.NO) ? '⛔️' : ''}
                    {journey.bicycle.has(GTFSBool.YES) ? '🚲' : ''}
                    {journey.bicycle.has(GTFSBool.NO) ? '🚳' : ''}
                    <RenderDuration durations={journey.duration} />
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </>
  );
};
