import type {
  OsmFeature,
  OsmNode,
  OsmPatch,
  OsmPatchFeature,
  OsmRelation,
} from 'osm-api';
import type { Geometry } from 'geojson';
import { LocationType, type Stop } from 'gtfs-types';
import type { SqlWorker } from 'gtfs-sqlite';
import type { NetworkConfig } from '../types/config.def';
import { createDiamond } from '../helpers/createDiamond';
import {
  getBaseRole,
  getChangesetTags,
  getOsmRef,
  getStopCode,
} from '../helpers/data';
import type { Count } from '../types/general.def';
import { conflateRelationMembers } from './tags/conflateRelationMembers';
import { conflateStationTags } from './tags/conflateStationTags';
import { getOsmStopsByRef } from './conflateStops';

export type OsmStation = OsmRelation & {
  children: OsmFeature[];
};

/** a GTFS station = an OSM stop_area */
export async function conflateStations(
  config: NetworkConfig,
  osmRaw: OsmFeature[],
  comms: SqlWorker,
) {
  const warnings = new Set<string>();
  const cols = await comms.getColumns('stops');
  const allStops = await comms.exec<Stop>(
    cols.has('location_type')
      ? `SELECT * FROM stops s WHERE s.location_type IN ('${LocationType.STOP}', '${LocationType.STATION}')`
      : 'SELECT * FROM stops',
  );
  const stopsById = Object.groupBy(allStops, (item) => item.stop_id);
  const stopsByStation = Object.groupBy(
    allStops,
    (item) => item.parent_station || '',
  );
  delete stopsByStation[''];

  const osmStationsWithNoRef: OsmStation[] = [];
  const osmStationsWithRef = new Map<string, OsmStation>();
  for (const feature of osmRaw) {
    if (
      feature.type === 'relation' &&
      feature.tags?.public_transport === 'stop_area'
    ) {
      const osmStation: OsmStation = {
        ...feature,
        children: feature.members
          .map((member) => {
            const osmMember = osmRaw.find(
              (f) => f.type === member.type && f.id === member.ref,
            );
            if (osmMember) return osmMember;

            // else: this feature was not returned by the overpass query, so
            // it must be something irrelevant (e.g. a shelter). No need to
            // print a warning.
            return undefined;
          })
          .filter((x): x is OsmFeature => !!x),
      };
      const ref = getOsmRef('stop', config, feature.tags).value;
      if (ref) {
        osmStationsWithRef.set(ref, osmStation);
      } else {
        osmStationsWithNoRef.push(osmStation);
      }
    }
  }

  const missing: OsmPatch = {
    type: 'FeatureCollection',
    features: [],
    size: 'medium',
    changesetTags: {
      ...getChangesetTags(config),
      comment: `Auto-add missing stop_area relations from GTFS data`,
    },
  };
  const edit: OsmPatch = {
    type: 'FeatureCollection',
    features: [],
    size: 'medium',
    changesetTags: {
      ...getChangesetTags(config),
      comment: `Auto-fix stop_area relations from GTFS data`,
    },
  };

  const { osmRawByRef } = getOsmStopsByRef(osmRaw, config);

  for (const _stationId in stopsByStation) {
    const gtfsStation = stopsById[_stationId]?.[0];
    if (!gtfsStation) {
      warnings.add(
        `'${_stationId}' is a parent, but it does not exist in the DB`,
      );
      continue;
    }

    const stationCode = getStopCode(gtfsStation);

    // if the user wants to skip this one, pretend it doesn't exist if
    if (config.ignoreStations?.includes(stationCode)) continue;

    const expectedOsmMembers = [
      ...new Set(stopsByStation[_stationId]?.map(getStopCode)),
    ]
      .map((stopCode) => osmRawByRef[stopCode])
      .filter(Boolean);

    // no point adding stations that only have one child
    if (expectedOsmMembers.length === 1) continue;

    const osmStation =
      osmStationsWithRef.get(stationCode) ||
      // if we can't find one with a match, try to find a matching one with no ref.
      // this is a much more expensive search
      osmStationsWithNoRef.find((actualStation) => {
        if (!expectedOsmMembers.length) return false;

        const count = expectedOsmMembers.filter((expectedMember) =>
          actualStation.children.some(
            (actualMember) =>
              actualMember.id === expectedMember.id &&
              actualMember.type === expectedMember.type,
          ),
        ).length;

        /** the percent of expected stops which exist in this relation */
        const percent = Math.round((count / expectedOsmMembers.length) * 100);

        if (percent > 0 && percent <= 50) {
          warnings.add(
            `Ignoring candidate station ${actualStation.type[0]}${actualStation.id} because it only has ${percent}% of expected members`,
          );
        }

        // if more than 50% of the stops are already in a relation,
        // we consider it a match.
        return percent > 50;
      });

    const tagChanges = conflateStationTags(
      config,
      osmStation?.tags || {},
      gtfsStation,
    );
    const memberChanges = conflateRelationMembers(
      osmStation?.members || [],
      expectedOsmMembers.map((feature) => ({
        type: feature.type,
        ref: feature.id,
        role: getBaseRole(feature.tags) || '',
      })),
    );

    const firstNode = expectedOsmMembers.find(
      (f): f is OsmNode => f.type === 'node',
    )!;
    if (!firstNode && (osmStation || !!memberChanges.length)) {
      warnings.add(
        `No OSM nodes in station ${stationCode} (${gtfsStation.stop_name})`,
      );
    }
    const geometry: Geometry = firstNode
      ? {
          type: 'Polygon',
          coordinates: createDiamond({
            lat: firstNode.lat,
            lng: firstNode.lon,
          }),
        }
      : { type: 'GeometryCollection', geometries: [] };

    if (osmStation) {
      // we found a match, so conflate its tags and members

      // if the only that needs changing is the name, skip it
      if (
        memberChanges.length === 0 &&
        Object.keys(tagChanges).join('|') === 'official_name'
      ) {
        continue;
      }

      // if nothing needs changing, no edit
      if (memberChanges.length === 0 && Object.keys(tagChanges).length === 0) {
        continue;
      }

      edit.features.push({
        type: 'Feature',
        id: osmStation.type[0] + osmStation.id,
        __comment: `[${stationCode}] ${gtfsStation.stop_name}`,
        geometry,
        // @ts-expect-error -- typedefs wrong
        properties: {
          __action: 'edit',
          ...tagChanges,
          __members: memberChanges,
        },
      });
    } else if (memberChanges.length) {
      // no match found, so create a station
      // but not if there are no members, since that's impossible
      missing.features.push({
        type: 'Feature',
        id: stationCode,
        geometry,
        // @ts-expect-error -- typedefs wrong
        properties: {
          ...tagChanges,
          __members: memberChanges,
        },
      });
    }
  }

  const seenIds = new Map<string | number | undefined, OsmPatchFeature>();
  for (const feature of [...missing.features, ...edit.features]) {
    if (seenIds.has(feature.id)) {
      warnings.add(
        // @ts-expect-error -- to make debugging easier
        `Duplicate entry ${feature.id} (${feature.__comment} vs ${
          // @ts-expect-error -- to make debugging easier
          seenIds.get(feature.id)!.__comment
        })`,
      );
    }
    seenIds.set(feature.id, feature);
  }

  const count: Count = {
    add: missing.features.filter((f) => f.properties?.__action === 'edit')
      .length,
    edit: edit.features.filter((f) => f.properties?.__action === 'edit').length,
    skipped: 0,
    total: Object.keys(stopsByStation).length,
  };

  return {
    osmPatch: { create: missing, update: edit },
    warnings,
    count,
  };
}
