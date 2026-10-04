import type {
  OsmFeature,
  OsmFeatureType,
  OsmPatch,
  OsmRelation,
  Tags,
} from 'osm-api';
import { LocationType, type Stop, type StopId } from 'gtfs-types';
import type { SqlWorker } from 'gtfs-sqlite';
import type { NetworkConfig } from '../types/config.def.js';
import { getRouteTagsForTransportMode } from '../helpers/tagging.js';
import { distanceBetween, getBearingBetweenCoords } from '../helpers/geo.js';
import { createDiamond } from '../helpers/createDiamond.js';
import {
  getBaseRole,
  getChangesetTags,
  getOsmRef,
  getStopCode,
} from '../helpers/data.js';
import type { Count } from '../types/general.def.js';
import {
  NON_MEANINGFUL_ROUTE_TAGS,
  conflateRouteTags,
} from './tags/conflateRouteTags.js';
import { conflateRelationMembers } from './tags/conflateRelationMembers.js';
import { Flags, type Journey, flagsToString } from './conflateStops.js';
import type { ConflationResult } from './index.js';

/** only edit the tags if at least 1 tag is meaningful */
const anyMeaningfulTagChanges = (tagChanges: Tags) =>
  !!Object.keys(tagChanges).length &&
  !Object.keys(tagChanges).every((tag) => NON_MEANINGFUL_ROUTE_TAGS.has(tag));

function getRanking(config: NetworkConfig, relation: OsmRelation) {
  const refTag = getOsmRef('route', config, relation.tags).key;

  // explicit ref for this feed, can't get any better
  if (refTag.startsWith('gtfs:')) return 3;

  if (
    relation.tags?.['network:wikidata']
      ?.split(';')
      .includes(config.networkWikidata)
  ) {
    return 2;
  }

  // penalise if there is a network[:wikidata] with the wrong value
  if (relation.tags?.['network:wikidata']) return 0;

  return 1;
}

/** This is very unreliable sadly */
function getRankingForJourney(
  relation: OsmRelation,
  journey: Journey,
  osmRawById: { [osmId: string]: OsmFeature },
  osmRawByRef: { [stopCode: string]: OsmFeature },
  stopsById: { [stopId: string]: Stop[] | undefined },
  config: NetworkConfig,
) {
  // this is a perfect match, but we don't encourage this tag, unless the
  // guesswork totally fails, because this column is unstable and not intended
  // for matching.
  if (journey.headsigns.has(relation.tags!['gtfs:trip_headsign'])) return 5;

  const members = relation.members.map((m) => ({
    ...m,
    feature: osmRawById[m.type[0] + m.ref],
  }));

  const firstOsm = members.find((m) => m.role === getBaseRole(m.feature?.tags));
  const lastOsm = members.findLast(
    (m) => m.role === getBaseRole(m.feature?.tags),
  );

  // unlikely match if we can't even find the first/last stops
  if (!firstOsm?.feature || !lastOsm?.feature) return -10;

  const firstGtfsId = journey.stopIds[0].stopId;
  const lastGtfsId = journey.stopIds.at(-1)!.stopId;

  const firstGtfs = stopsById[firstGtfsId]![0];
  const lastGtfs = stopsById[lastGtfsId]![0];

  const osmDirection = relation.tags!.direction;
  const gtfsBearing = getBearingBetweenCoords(
    firstGtfs.stop_lat!,
    firstGtfs.stop_lon!,
    lastGtfs.stop_lat!,
    lastGtfs.stop_lon!,
  );
  const gtfsDistance = distanceBetween(
    firstGtfs.stop_lat!,
    firstGtfs.stop_lon!,
    lastGtfs.stop_lat!,
    lastGtfs.stop_lon!,
  );
  const gtfsDirection =
    gtfsBearing <= 0 + 45
      ? 'north'
      : gtfsBearing >= 0 + 45 && gtfsBearing <= 90 + 45
        ? 'east'
        : gtfsBearing >= 90 + 45 && gtfsBearing <= 180 + 45
          ? 'south'
          : gtfsBearing >= 180 + 45 && gtfsBearing <= 270 + 45
            ? 'west'
            : 'north';

  // also check that the start & end are sufficiently far apart.
  // if they're too close, then there might not be an obvious
  // cardinal direction
  if (osmDirection && osmDirection === gtfsDirection && gtfsDistance > 10000) {
    return 4;
  }

  const membersWithMatches = journey.stopIds
    .map(({ stopId }) => {
      const stop = stopsById[stopId]?.[0];
      if (!stop) return undefined;
      const osmStop = osmRawByRef[getStopCode(stop, config)];
      return members.some((m) => m.feature && m.feature === osmStop);
    })
    .filter(Boolean);

  const percentMatching =
    100 * (membersWithMatches.length / journey.stopIds.length);

  // if this relation has >80% of the expected stops, then that's really good.
  // also check that there are a reasonably number of expected stops, because
  // a small sample size will make this less safe
  if (percentMatching > 80 && journey.stopIds.length > 8) return 3;

  const isFirstEqual = osmRawByRef[firstGtfsId] === firstOsm.feature;
  const isLastEqual = osmRawByRef[lastGtfsId] === lastOsm.feature;
  if (isFirstEqual && isLastEqual) return 2;
  if (isFirstEqual || isLastEqual) return 1;

  return 0;
}

function getExpectedStops(
  config: NetworkConfig,
  stops: { stopId: StopId; flags: Flags }[],
  allStops: Stop[],
  stopsById: { [stopId: StopId]: Stop[] | undefined },
  osmRawByRef: { [stopCode: string]: OsmFeature },
): OsmRelation['members'] {
  const expectedOsmStopsString: (string | undefined)[] = stops.map(
    ({ stopId, flags }) => {
      // find the stopCode for this stopId
      let gtfsStop = stopsById[stopId]?.[0];

      if (!gtfsStop) {
        throw new Error(
          `(invalid GTFS) route references stop_id=${stopId} which does not exist.`,
        );
      }

      let stopCode = getStopCode(gtfsStop, config);

      if (stopCode && stopCode in config.ignoreStops!) {
        const overrideValue = config.ignoreStops![stopCode];

        if (overrideValue === null) {
          // don't error if the user is decidedly ignoring this stop
          return undefined;
        }

        // apply the override
        const override = allStops.find(
          (s) => getStopCode(s, config) === overrideValue,
        );
        if (!override) {
          throw new Error(
            `${stopCode} is overriden to ${overrideValue}, but this is not a valid stop_code.`,
          );
        }
        gtfsStop = override;
        stopCode = getStopCode(gtfsStop, config);
      }

      const osmStop = osmRawByRef[stopCode];

      if (!osmStop) {
        throw new Error(`no stop in osm for ${stopCode}`);
      }

      const role = flagsToString(flags, getBaseRole(osmStop.tags)!);

      if (!role) return undefined;

      return `${osmStop.type}|${osmStop.id}|${role}`;
    },
  );

  // required to filter out duplicate stopIds
  const expectedOsmStops: OsmRelation['members'] = [
    ...new Set(expectedOsmStopsString.filter((x): x is string => !!x)),
  ].map((string) => {
    const [type, ref, role] = string.split('|');
    return { type: type as OsmFeatureType, ref: +ref, role };
  });

  return expectedOsmStops;
}

export async function conflateRoutes(
  config: NetworkConfig,
  osmRaw: OsmFeature[],
  comms: SqlWorker,
  conflationResult: ConflationResult,
) {
  const warnings = new Set<string>();

  const osmRawById: { [osmId: string]: OsmFeature } = {};
  for (const f of osmRaw) {
    osmRawById[f.type[0] + f.id] = f;
  }

  const { gtfsRouteData, osmRawByRef } = conflationResult.stops!;
  for (const r of osmRaw) {
    const ref = getOsmRef('route', config, r.tags).value;
    if (r.type === 'relation' && r.tags?.route && ref) {
      const wayMemberCount = r.members.filter((w) => w.type === 'way').length;
      if (wayMemberCount < 1) {
        warnings.add(`r${r.id} (${ref}) has no geometry`);
      }
    }
  }

  const cols = await comms.getColumns('stops');
  const allStops = await comms.exec<Stop>(
    cols.has('location_type')
      ? `SELECT * FROM stops s WHERE s.location_type IN ('${LocationType.STOP}', '${LocationType.STATION}', '')`
      : 'SELECT * FROM stops',
  );
  const stopsById = Object.groupBy(allStops, (item) => item.stop_id);

  // create a map so that we can find the parent route_master given any relationId
  const routeMastersByMember: { [relationId: number]: number[] } = {};
  for (const r of osmRaw) {
    if (r.type === 'relation' && r.tags?.type === 'route_master') {
      for (const child of r.members) {
        if (child.type === 'relation') {
          routeMastersByMember[child.ref] ||= [];
          routeMastersByMember[child.ref].push(r.id);
        }
      }
    }
  }

  const add: OsmPatch = {
    type: 'FeatureCollection',
    features: [],
    size: 'medium',
    changesetTags: {
      ...getChangesetTags(config),
      comment: 'Add missing transit route relations from GTFS data',
    },
  };
  const edit: OsmPatch = {
    type: 'FeatureCollection',
    features: [],
    size: 'medium',
    changesetTags: {
      ...getChangesetTags(config),
      comment:
        'Auto-update the stop/platform roles of transit route relations from GTFS data',
    },
  };
  const editRouteMaster: OsmPatch = {
    type: 'FeatureCollection',
    features: [],
    size: 'medium',
    changesetTags: {
      ...getChangesetTags(config),
      comment: 'Auto-update route_master relations for public transport routes',
    },
  };

  let skipped = 0;

  // eslint-disable-next-line no-labels
  outer: for (const rsn in gtfsRouteData) {
    const gtfsRoute = gtfsRouteData[rsn];
    const { route: routeTagValue } = getRouteTagsForTransportMode(
      gtfsRoute.vehicleType,
      warnings,
    );

    if (gtfsRoute.ignore) continue;

    const candiateOsmRouteMasters = osmRaw
      .filter(
        (feature): feature is OsmRelation =>
          feature.type === 'relation' &&
          feature.tags?.type === 'route_master' &&
          feature.tags.route_master === routeTagValue &&
          getOsmRef('route', config, feature.tags).value === gtfsRoute.rsn,
      )
      .map((relation) => ({
        ...relation,
        score: getRanking(config, relation),
      }))
      .toSorted((a, b) => b.score - a.score);

    if (candiateOsmRouteMasters.length) {
      // MARK: PTv2
      // PTv2: a separate relation for each (normal) trip, grouped
      // by a route_master relation.

      if (candiateOsmRouteMasters.length > 1) {
        const relationIds = candiateOsmRouteMasters
          .map((r) => r.type[0] + r.id)
          .join(', ');
        warnings.add(
          `[PTv2] Skipping ${rsn} as there are multiple similar route_master relations: ${relationIds}`,
        );
        continue;
      }

      const routeMaster = candiateOsmRouteMasters[0];
      let childOsmRoutes = routeMaster.members.map(
        (m) => osmRawById[m.type[0] + m.ref],
      );

      if (childOsmRoutes.some((m) => !m)) {
        warnings.add(
          `[PTv2] Some members of route_master: r${routeMaster.id} were not downloaded, so they must be mistagged.`,
        );
        continue;
      }
      childOsmRoutes = childOsmRoutes.filter(Boolean);

      // match each GTFS trip to an OSM route. this is non-trivial
      // and a lot of guesswork.
      for (const journey of gtfsRoute.journeys) {
        if (!journey.keep) continue;

        const bestMatch = childOsmRoutes
          .filter((m) => m.type === 'relation')
          .map((relation) => ({
            relation,
            score: getRankingForJourney(
              relation,
              journey,
              osmRawById,
              osmRawByRef,
              stopsById,
              config,
            ),
          }))
          .toSorted((a, b) => b.score - a.score);

        const bestScore = bestMatch[0]?.score;
        const numberWithSameScore = bestMatch.filter(
          (x) => x.score === bestScore,
        ).length;

        if (numberWithSameScore > 1) {
          const relationIds = bestMatch
            .map((r) => r.relation.type[0] + r.relation.id)
            .join(', ');
          warnings.add(
            `[PTv2] Skipping ${rsn} as there are multiple similar route relations (${relationIds}) which matched the same directional variant (score=${bestScore}) for ${[...journey.headsigns]}.`,
          );
          skipped++;
          continue outer; // eslint-disable-line no-labels
        }

        journey.match = { rId: bestMatch[0].relation.id };

        let expectedOsmStops: OsmRelation['members'];
        try {
          expectedOsmStops = getExpectedStops(
            config,
            journey.stopIds,
            allStops,
            stopsById,
            osmRawByRef,
          );
        } catch (ex) {
          warnings.add(`[PTv1] Skipping ${rsn} because ${(<Error>ex).message}`);
          skipped++;
          continue;
        }

        // 1. Check tags on the route relation
        const tagChanges = conflateRouteTags(
          config,
          bestMatch[0].relation.tags!,
          gtfsRoute,
          warnings,
          journey,
        );

        // 2. Check stops within the route
        const memberChanges = conflateRelationMembers(
          bestMatch[0].relation.members,
          expectedOsmStops,
          { removeAllOtherNodes: true },
        );

        if (anyMeaningfulTagChanges(tagChanges)) {
          edit.features.push({
            type: 'Feature',
            id: bestMatch[0].relation.type[0] + bestMatch[0].relation.id,
            __comment: rsn,
            geometry: {
              type: 'GeometryCollection',
              geometries: [],
            },
            // @ts-expect-error -- typedefs are wrong
            properties: {
              __action: 'edit',
              ...tagChanges,
              __members: memberChanges,
            },
          });
        }
      }

      gtfsRoute.match = { PTv: 2, rId: routeMaster.id };

      const tagChanges = conflateRouteTags(
        config,
        routeMaster.tags!,
        gtfsRoute,
        warnings,
        'ROUTE_MASTER',
      );

      if (anyMeaningfulTagChanges(tagChanges)) {
        editRouteMaster.features.push({
          type: 'Feature',
          id: routeMaster.type[0] + routeMaster.id,
          __comment: `route_master for ${rsn}`,
          geometry: {
            type: 'GeometryCollection',
            geometries: [],
          },
          // @ts-expect-error -- typedefs are wrong
          properties: {
            __action: 'edit',
            ...tagChanges,
            __members: [], // TODO: also check if there are any superflouous members
          },
        });
      }

      // check that the child routes belongs to only this route_master, and no others
      const allParents = new Set(
        childOsmRoutes.flatMap((r) => routeMastersByMember[r.id]),
      );
      if (allParents.size > 1) {
        // the routes belong to multiple different route_masters
        const routeIds = childOsmRoutes.map((r) => r.type[0] + r.id).join(', ');
        const routeMasterIds = [...allParents]
          .map((id) => `r${id}`)
          .join(' and ');
        warnings.add(
          `[PTv2] Some of these relations (${routeIds}) belong to multiple route_masters (${routeMasterIds})`,
        );
      }
    } else {
      // MARK: PTv1
      // PTv1: a single relation which agglomerates every trip for this route
      const candiateOsmRoutes = osmRaw
        .filter(
          (feature): feature is OsmRelation =>
            feature.type === 'relation' &&
            feature.tags?.type === 'route' &&
            feature.tags.route === routeTagValue &&
            getOsmRef('route', config, feature.tags).value === gtfsRoute.rsn,
        )
        .map((relation) => ({
          ...relation,
          score: getRanking(config, relation),
        }))
        .toSorted((a, b) => b.score - a.score);

      const bestScore = candiateOsmRoutes[0]?.score;
      const numberWithSameScore = candiateOsmRoutes.filter(
        (x) => x.score === bestScore,
      ).length;

      if (numberWithSameScore > 1) {
        const relationIds = candiateOsmRoutes
          .map((r) => r.type[0] + r.id)
          .join(', ');
        warnings.add(
          `[PTv1] Skipping ${rsn} as there are multiple similar route relations: ${relationIds}. Use PTv2 or a single PTv1 relation.`,
        );
        skipped++;
        continue;
      }

      const osmRoute = candiateOsmRoutes[0];

      // merge all the stops and bitwise-merge their flags
      const mergedStops: { [stopId: string]: Flags } = {};
      for (const journey of gtfsRoute.journeys) {
        if (journey.keep) {
          for (const stop of journey.stopIds) {
            mergedStops[stop.stopId] ||= Flags.None;
            mergedStops[stop.stopId] |= stop.flags;
          }
        }
      }

      let expectedOsmStops: OsmRelation['members'];
      try {
        expectedOsmStops = getExpectedStops(
          config,
          Object.entries(mergedStops).map(([stopId, flags]) => ({
            stopId,
            flags,
          })),
          allStops,
          stopsById,
          osmRawByRef,
        );
      } catch (ex) {
        warnings.add(`[PTv1] Skipping ${rsn} because ${(<Error>ex).message}`);
        skipped++;
        continue;
      }

      const randomStop =
        stopsById[
          Object.keys(mergedStops).find((stopId) => stopsById[stopId])!
        ]?.[0];

      if (osmRoute) {
        gtfsRoute.match = { PTv: 1, rId: osmRoute.id };

        // 1. Check tags on the route relation
        const tagChanges = conflateRouteTags(
          config,
          osmRoute.tags!,
          gtfsRoute,
          warnings,
          'PTv1',
        );

        // 2. Check stops within the route
        const memberChanges = conflateRelationMembers(
          osmRoute.members,
          expectedOsmStops,
          { removeAllOtherNodes: true },
        );

        if (anyMeaningfulTagChanges(tagChanges) || !!memberChanges.length) {
          edit.features.push({
            type: 'Feature',
            id: osmRoute.type[0] + osmRoute.id,
            __comment: rsn,
            geometry: {
              type: 'Polygon',
              coordinates: randomStop
                ? createDiamond({
                    lat: +randomStop.stop_lat!,
                    lng: +randomStop.stop_lon!,
                  })
                : [],
            },
            // @ts-expect-error -- typedefs are wrong
            properties: {
              __action: 'edit',
              ...tagChanges,
              __members: memberChanges,
            },
          });
        }
      } else {
        add.features.push({
          type: 'Feature',
          id: rsn,
          geometry: {
            type: 'GeometryCollection',
            geometries: [],
          },
          // @ts-expect-error -- typedefs are wrong
          properties: {
            type: 'route',
            ...conflateRouteTags(config, {}, gtfsRoute, warnings, 'PTv1'),
            __members: expectedOsmStops,
          },
        });
      }
    }
  }

  const count: Count = {
    add: add.features.length,
    edit: edit.features.length,
    skipped,
    total: Object.keys(gtfsRouteData).length,
  };

  return {
    osmPatch: { add, edit, routeMaster: editRouteMaster },
    warnings,
    count,
  };
}
