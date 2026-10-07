import type { OsmFeature, OsmPatch, OsmPatchFeature } from 'osm-api';
import {
  Alight,
  GTFSBool,
  type Stop,
  type StopId,
  type TripId,
  type VehicleType,
} from 'gtfs-types';
import type { SqlWorker } from 'gtfs-sqlite';
import type { NetworkConfig } from '../types/config.def.js';
import { distanceBetween, isInBbox } from '../helpers/geo.js';
import { createDiamond } from '../helpers/createDiamond.js';
import { TRIP_PERCENT_THRESHOLD } from '../config/_global.ts';
import type { Count, Merged } from '../types/general.def.js';
import {
  type BaseRole,
  getBaseRole,
  getChangesetTags,
  getOsmRef,
  getStopCode,
} from '../helpers/data.js';
import { hhmmss } from '../helpers/js.js';
import {
  NON_MEANINGFUL_TAGS,
  conflateStopTags,
} from './tags/conflateStopTags.js';

export enum Flags {
  None = 0,
  PickUp = 1 << 0,
  DropOff = 1 << 1,
  OnDemand = 1 << 2,
}

export const flagsToString = (
  flags: Flags,
  base: BaseRole,
):
  | `${BaseRole}${'' | '_on_demand'}${'' | '_exit_only' | '_entry_only'}`
  | undefined => {
  const extra = flags & Flags.OnDemand ? '_on_demand' : '';

  const type =
    flags & Flags.PickUp && flags & Flags.DropOff
      ? '' // normal, no suffix
      : flags & Flags.PickUp
        ? '_entry_only'
        : flags & Flags.DropOff
          ? '_exit_only'
          : undefined;

  // if there are 0 flags, then the stop allows neither
  // picking up, nor dropping off. This is a bit illogical,
  // but it occurs in the NZ-AKL feed. It means the service
  // doesn't actually stop here, and so it should not be included.
  if (type === undefined) return undefined;

  return `${base}${extra}${type}`;
};

export interface JourneyStop {
  stopId: StopId;
  flags: Flags;
}

type RawPatternStop = [
  //
  stopId: StopId,
  pickupType: Alight,
  dropOffType: Alight,
];

type RawPatternTrip = [
  tripId: TripId,
  headsign: string | null,
  wheelchair: GTFSBool | null,
  bicycle: GTFSBool | null,
  startTime: string | null,
  endTime: string | null,
];

/**
 * A _Journey_ is not a concept that exists in GTFS. We use this
 * term to refer to a group of _Trips_ which share the same stopping
 * pattern. Mapping:
 *  - GTFS {@link Route} = OSM `route_master`
 *  - GTFS {@link Journey} = OSM `route`
 *  - GTFS {@link Trip} = _no osm equivilant_
 */
export interface Journey {
  tripIds: string[];
  headsigns: Set<string>;
  wheelchair: Set<GTFSBool>;
  bicycle: Set<GTFSBool>;
  stopIds: JourneyStop[];
  /** length of each trip in seconds */
  duration: number[];
  /** true if common enough to be included in OSM */
  keep: boolean;
  match?: { rId: number };
}

export interface GtfsDetailedRoute {
  vehicleType: VehicleType;
  rsn: string;
  rln: string | undefined;
  colour: string | undefined;
  operators: string[];
  tripIds: Set<string>;
  journeys: Journey[];
  ignore: boolean;
  match?: { PTv: 1 | 2; rId: number };
}

export interface FinalGTFSOutput {
  [rsn: string]: GtfsDetailedRoute;
}

/**
 * if we find two stops in OSM with the same ref, then
 * determine the most likely match using a numeric ranking.
 */
function getRanking(config: NetworkConfig, existing: OsmFeature) {
  const network = existing.tags?.network?.split(';');
  const networkQId = existing.tags?.['network:wikidata']?.split(';');
  const refKey = getOsmRef('stop', config, existing.tags)!.key;
  // TODO: consider geolocation as a factor

  // explicit ref for this feed, can't get any better
  if (refKey.startsWith('gtfs:')) return 4;

  if (networkQId?.includes(config.networkWikidata)) return 3;
  if (network?.includes(config.networkName)) return 2;

  // penalise if there is a network[:wikidata] with the wrong value
  if (network || networkQId) return 0;

  return 1;
}

export function getOsmStopsByRef(osmRaw: OsmFeature[], config: NetworkConfig) {
  const duplicateRefs: { [ref: string]: Set<string> } = {};
  const temporary: { [ref: string]: OsmFeature[] } = {};
  const osmRawByRef: { [stopCode: string]: OsmFeature } = {};

  for (const feature of osmRaw) {
    const isStop = !!getBaseRole(feature.tags);

    const ref = getOsmRef('stop', config, feature.tags).value;
    if (isStop && ref) {
      temporary[ref] ||= [];
      temporary[ref].push(feature);
    }
  }

  for (const ref in temporary) {
    const stops = temporary[ref];
    if (stops.length === 1) {
      // easy
      osmRawByRef[ref] = stops[0];
    } else {
      // multiple matches. try to find the best one
      const withRanking = stops
        .map((stop) => ({
          stop,
          ranking:
            getRanking(config, stop) +
            (getBaseRole(stop.tags) === 'platform' ? 0.5 : 0),
        }))
        .toSorted((a, b) => b.ranking - a.ranking);

      if (withRanking[0].ranking === withRanking[1].ranking) {
        // we couldn't resolve the ambiguity, the 2 best candidates
        // have a equal probability. So we'll have to skip this stop,
        // and emit a warning later if we need it.
        duplicateRefs[ref] ||= new Set(stops.map((s) => s.type[0] + s.id));
      } else {
        // one of the duplicates is distinctly more likely than
        // the others, so use it
        osmRawByRef[ref] = withRanking[0].stop;
      }
    }
  }

  for (const stopCode in duplicateRefs) {
    delete temporary[stopCode];
  }

  return { osmRawByRef, duplicateRefs };
}

/**
 * This is straightforward, no relations to deal with.
 * Just looking at the tags on each node.
 */
export async function conflateStops(
  config: NetworkConfig,
  osmRaw: OsmFeature[],
  comms: SqlWorker,
) {
  const warnings = new Set<string>();

  const allStops = await comms.exec<Stop>('SELECT * FROM stops');
  const allStopsById = Object.groupBy(allStops, (s) => s.stop_id);
  const allStopsByCode = Object.groupBy(allStops, (s) =>
    getStopCode(s, config),
  );

  // some columns are options, so we need to check if they exist in this feed first
  const cols = {
    st: await comms.getColumns('stop_times'),
    t: await comms.getColumns('trips'),
    r: await comms.getColumns('routes'),
  };

  const operatorsByRsn = Object.groupBy(
    await comms.exec<
      Merged<'route_short_name' | 'route_long_name' | 'agency_name'>
    >(`
    SELECT DISTINCT
    ${cols.r.has('agency_id') ? 'a.agency_name,' : ''}
      r.route_short_name,
      r.route_long_name
    FROM routes r
      ${cols.r.has('agency_id') ? 'INNER JOIN agency a ON r.agency_id = a.agency_id' : ''}
    `),
    (row) => row.route_short_name,
  );

  const _rawPatterns = await comms.exec<
    Merged<'route_short_name' | 'route_type' | 'route_color'> & {
      stops: Stringified<RawPatternStop[]>;
      trips: Stringified<RawPatternTrip[]>;
    }
  >(`
    WITH trip_patterns AS (
      SELECT
        st.trip_id,
        json_group_array(
          json_array(
            ${/** this is building {@link RawPatternStop} */ ''}
            st.stop_id,
            ${cols.st.has('pickup_type') ? `coalesce(CAST(nullif(st.pickup_type, '') AS INTEGER), ${Alight.AVAILABLE})` : Alight.AVAILABLE},
            ${cols.st.has('drop_off_type') ? `coalesce(CAST(nullif(st.drop_off_type, '') AS INTEGER), ${Alight.AVAILABLE})` : Alight.AVAILABLE}
          ) ORDER BY st.stop_sequence
        ) AS stops,
        json_group_array(
          coalesce(
            nullif(st.arrival_time, ''),
            nullif(st.departure_time, '')
          )
          ORDER BY st.stop_sequence
        ) AS times
      FROM stop_times st
      GROUP BY st.trip_id
    )
    SELECT
      ${cols.r.has('route_color') ? 'r.route_color,' : ''}
      r.route_short_name,
      r.route_type,
      p.stops,
      json_group_array(
        json_array(
          ${/** this is building {@link RawPatternTrip} */ ''}
          t.trip_id,
          ${cols.t.has('trip_headsign') ? 't.trip_headsign' : 'NULL'},
          ${cols.t.has('wheelchair_accessible') ? 't.wheelchair_accessible' : 'NULL'},
          ${cols.t.has('bikes_allowed') ? 't.bikes_allowed' : 'NULL'},
          p.times ->> '$[0]',
          p.times ->> '$[#-1]'
        )
      ) AS trips
    FROM trip_patterns p
    INNER JOIN trips t ON p.trip_id = t.trip_id
    INNER JOIN routes r ON t.route_id = r.route_id
    GROUP BY r.route_short_name, p.stops
  `);

  const gtfsRouteData: FinalGTFSOutput = {};

  /**
   * some trip_ids have the same stopping pattern, so
   * we group them all together by a "patternKey" which is just
   * the stop_ids concatenating in the correct order. We ignore
   * flags for this comparison, since we can can bitwise-merge
   * the flags later.
   */
  const patternsByRsn: {
    [rsn: string]: {
      [patternKey: string]: {
        stopIds: JourneyStop[];
        journey: Omit<Journey, 'stopIds' | 'keep'>;
      };
    };
  } = {};

  for (const row of _rawPatterns) {
    gtfsRouteData[row.route_short_name] ||= {
      rsn: row.route_short_name,
      rln: operatorsByRsn[row.route_short_name]![0].route_long_name, // just take the first RLN
      colour: row.route_color,
      operators: [
        ...new Set(
          operatorsByRsn[row.route_short_name]!.map(
            (item) => item.agency_name,
          ).filter(Boolean),
        ),
      ],
      vehicleType:
        config.overrideTransportModes?.[row.route_short_name] || row.route_type,
      tripIds: new Set<string>(),
      journeys: [],
      ignore: !!config.ignoreRoutes?.includes(row.route_short_name),
    };

    const rawStops = JSON.parse(row.stops);
    const sequence = rawStops.map(
      ([rawStopId, pickupType, dropOffType], index): JourneyStop => {
        const isOnDemand =
          dropOffType === Alight.MUST_CONTACT_DRIVER ||
          dropOffType === Alight.MUST_CONTACT_AGENCY ||
          pickupType === Alight.MUST_CONTACT_DRIVER ||
          pickupType === Alight.MUST_CONTACT_AGENCY;

        const isDropOff =
          dropOffType !== Alight.NOT_AVAILABLE &&
          // the first stop cannot be dropoff
          index !== 0;

        const isPickUp =
          pickupType !== Alight.NOT_AVAILABLE &&
          // the last stop cannot be pickup
          index !== rawStops.length - 1;

        let flags = Flags.None;
        if (isDropOff) flags |= Flags.DropOff;
        if (isPickUp) flags |= Flags.PickUp;
        if (isOnDemand) flags |= Flags.OnDemand;

        let stopId = rawStopId;

        const stop = allStopsById[rawStopId]?.[0];
        const overrideId =
          stop && config.ignoreStops?.[getStopCode(stop, config)];
        if (overrideId) {
          const override = allStopsByCode[overrideId]?.[0];
          if (override) {
            stopId = override.stop_id;
          } else {
            warnings.add(
              `Stop ${rawStopId} is overriden to be ${overrideId}, but there is no such stop`,
            );
          }
        }

        return { stopId, flags };
      },
    );

    const patternKey = sequence.map((stop) => stop.stopId).join('␞');

    patternsByRsn[row.route_short_name] ||= {};
    patternsByRsn[row.route_short_name][patternKey] ||= {
      stopIds: sequence.map((stop) => ({ ...stop, flags: Flags.None })),
      journey: {
        tripIds: [],
        headsigns: new Set(),
        wheelchair: new Set(),
        bicycle: new Set(),
        duration: [],
      },
    };
    const { stopIds, journey } =
      patternsByRsn[row.route_short_name][patternKey];

    // merge the flags together for each stop
    for (let i = 0; i < sequence.length; i++) {
      stopIds[i].flags |= sequence[i].flags;
    }

    const rawTrips = JSON.parse(row.trips);
    for (const rawTrip of rawTrips) {
      const [tripId, headsign, wheelchair, bicycle, startTime, endTime] =
        rawTrip;
      gtfsRouteData[row.route_short_name].tripIds.add(tripId);

      journey.tripIds.push(tripId);
      if (headsign) journey.headsigns.add(headsign);
      journey.wheelchair.add(wheelchair || GTFSBool.NOT_SPECIFIED);
      journey.bicycle.add(bicycle || GTFSBool.NOT_SPECIFIED);

      if (startTime && endTime) {
        const duration =
          hhmmss.toSeconds(endTime) - hhmmss.toSeconds(startTime);
        if (duration) journey.duration.push(duration);
      }
    }
  }

  for (const rsn in gtfsRouteData) {
    gtfsRouteData[rsn].journeys = Object.values(patternsByRsn[rsn]).map(
      ({ stopIds, journey }): Journey => {
        // less than TRIP_PERCENT_THRESHOLD% of trips stop here, so it must be a special
        // stop e.g. the night-bus version of the 82
        const keep =
          (journey.tripIds.length / gtfsRouteData[rsn].tripIds.size) * 100 >=
            TRIP_PERCENT_THRESHOLD || !!config.includeAllStops;

        return {
          ...journey,
          stopIds,
          keep,
        };
      },
    );
  }

  // store which stops are actually in use, so that we don't add disused ones.
  // also store the stop's mode of transport.
  const stopsInUse: { [stopId: StopId]: Set<VehicleType> } = {};
  for (const rsn in gtfsRouteData) {
    const totalTripIds = gtfsRouteData[rsn].journeys
      .map((journey) => journey.tripIds.length)
      .reduce((a, b) => a + b, 0);

    for (const journey of gtfsRouteData[rsn].journeys) {
      const isRegularTrip =
        (journey.tripIds.length / totalTripIds) * 100 >
          TRIP_PERCENT_THRESHOLD || config.includeAllStops;

      if (!isRegularTrip) continue;

      for (const stop of journey.stopIds) {
        // it's possible for multiple modes of transport to stop at the same stop
        // e.g. light rail/bus/school bus
        stopsInUse[stop.stopId] ||= new Set();
        stopsInUse[stop.stopId].add(gtfsRouteData[rsn].vehicleType);
      }
    }
  }

  const osmPatchMissing: OsmPatch = {
    type: 'FeatureCollection',
    features: [],
    size: 'medium',
    changesetTags: {
      ...getChangesetTags(config),
      comment: 'Auto-add missing transit stops from GTFS data',
    },
  };
  const osmPatchWrong: OsmPatch = {
    type: 'FeatureCollection',
    features: [],
    size: 'medium',
    changesetTags: {
      ...getChangesetTags(config),
      comment: 'Auto-fix transit stops from GTFS data',
    },
  };
  const osmPatchDisused: OsmPatch = {
    type: 'FeatureCollection',
    features: [],
    size: 'medium',
    changesetTags: {
      ...getChangesetTags(config),
      // no changeset comment, this one isn't meant to be uploaded.
      // it's just an FYI.
    },
  };

  config.ignoreStops ||= {};

  const { osmRawByRef, duplicateRefs } = getOsmStopsByRef(osmRaw, config);

  let skipped = 0;

  for (const stopCode in allStopsByCode) {
    const osmItem = osmRawByRef[stopCode];

    // don't import stops that the user wants to ignore
    if (stopCode in config.ignoreStops) continue;

    // try to find the stopId that's acutally in use
    const gtfsItem =
      allStopsByCode[stopCode]!.find((s) => s.stop_id in stopsInUse) ||
      allStopsByCode[stopCode]![0];

    // if the stop is outside the user-defined bbox, skip it.
    if (
      config.bbox &&
      !isInBbox(config.bbox, gtfsItem.stop_lat!, gtfsItem.stop_lon!)
    ) {
      skipped++;
      continue;
    }

    const modeOfTransports: Set<VehicleType> | undefined =
      stopsInUse[gtfsItem.stop_id];

    if (modeOfTransports === undefined) {
      // skip stops that are not used by any routes.
      // this is a design decision but also a technical
      // limitation because we need at least 1 route to
      // determine the mode of transport for the stop.
      osmPatchDisused.features.push({
        type: 'Feature',
        id: stopCode,
        geometry: {
          type: 'Point',
          coordinates: [+gtfsItem.stop_lon!, +gtfsItem.stop_lat!],
        },
        properties: { name: gtfsItem.stop_name!, ref: stopCode },
      });
      continue;
    }

    if (duplicateRefs[stopCode]) {
      warnings.add(
        `Skipping ${stopCode} because there are multiple matches in OSM (${[...duplicateRefs[stopCode]].join(', ')})`,
      );
      skipped++;
      continue;
    }

    const fallback: OsmPatchFeature = {
      type: 'Feature',
      id: stopCode,
      geometry: {
        type: 'Point',
        coordinates: [+gtfsItem.stop_lon!, +gtfsItem.stop_lat!],
      },
      properties: {
        ...conflateStopTags(
          config,
          {},
          modeOfTransports,
          gtfsItem,
          stopCode,
          warnings,
        ),
      },
    };

    if (osmItem?.tags) {
      // this is a good start, the stop already exists in OSM.

      // skip non-nodes, we can't conflate them if anything is wrong
      if (osmItem.type !== 'node') {
        warnings.add(
          `can’t conflate non-node tagged as a stop: ${osmItem.type[0]}${osmItem.id}`,
        );
        continue;
      }

      // within 500m
      const osmItemIsPrettyClose =
        distanceBetween(
          +gtfsItem.stop_lat!,
          +gtfsItem.stop_lon!,
          osmItem.lat,
          osmItem.lon,
        ) < 400; // 400m is what the java research paper used

      if (osmItemIsPrettyClose) {
        const tagChanges = conflateStopTags(
          config,
          osmItem.tags,
          modeOfTransports,
          gtfsItem,
          stopCode,
          warnings,
        );

        // no point editing a node just to "upgrade tags"
        const anyMeaningfulChanges =
          !!Object.keys(tagChanges).length &&
          !Object.keys(tagChanges).every((tag) => NON_MEANINGFUL_TAGS.has(tag));

        if (anyMeaningfulChanges) {
          // some tags need changing
          osmPatchWrong.features.push({
            type: 'Feature',
            id: osmItem.type[0] + osmItem.id,
            geometry: {
              type: 'Polygon',
              coordinates: createDiamond({
                lat: osmItem.lat,
                lng: osmItem.lon,
              }),
            },
            properties: { __action: 'edit', ...tagChanges },
          });
        } else {
          // this stop is perfect
        }
      } else {
        // stop is too far away to conceively be the one we're looking for.
        // so suggest creating a new one
        osmPatchMissing.features.push(fallback);
      }
    } else {
      // stop does not exist in OSM -> so suggest creating it
      osmPatchMissing.features.push(fallback);
    }
  }

  const count: Count = {
    add: osmPatchMissing.features.length,
    edit: osmPatchWrong.features.length,
    skipped,
    total: Object.keys(allStopsByCode).length - osmPatchDisused.features.length,
  };

  return {
    osmPatchMissing,
    osmPatchWrong,
    osmPatchDisused,
    gtfsRouteData,
    osmRawByRef,
    count,
    warnings,
  };
}
