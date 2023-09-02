import { promises as fs } from "node:fs";
import { join } from "node:path";
import type { OsmFeature, OsmNode, OsmRelation } from "osm-api";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { StopsStationsOutput } from "../readStopsFromGtfs";
import { getOsmStopsByRef } from "./conflateStops";
import { createDiamond, withConfig } from "../../util";
import { conflateRelationMembers, conflateStationTags } from "./tags";

export type OsmStation = OsmRelation & {
  children: OsmFeature[];
};

/** a GTFS station = an OSM stop_area */
export async function conflateStations(tempFolder: string) {
  const osmRaw: OsmFeature[] = JSON.parse(
    await fs.readFile(join(tempFolder, "osmRaw.json"), "utf8")
  );

  const gtfsStops: StopsStationsOutput & {
    // extra attributes added in the file
    stations: { [ref: string]: { children: string[] } };
  } = JSON.parse(await fs.readFile(join(tempFolder, "gtfsStops.json"), "utf8"));

  const stationsIdToCode: Record<string, string> = {};
  for (const stationCode in gtfsStops.stations) {
    for (const stationId of gtfsStops.stations[stationCode].stationIds) {
      stationsIdToCode[stationId] = stationCode;
    }
  }

  // update the stations to include a list of child stops
  for (const stopCode in gtfsStops.stops) {
    const stop = gtfsStops.stops[stopCode];
    for (const parentStationId of stop.parentStationIds) {
      const stationCode = stationsIdToCode[parentStationId];
      if (gtfsStops.stations[stationCode]) {
        gtfsStops.stations[stationCode].children ||= [];
        gtfsStops.stations[stationCode].children.push(stopCode);
      } else {
        console.warn(
          `Don't know about ${stationCode} / ${parentStationId}`.yellow
        );
      }
    }
  }

  const osmStationsWithNoRef: OsmStation[] = [];
  const osmStationsWithRef = new Map<string, OsmStation>();
  for (const feature of osmRaw) {
    if (
      feature.type === "relation" &&
      feature.tags?.public_transport === "stop_area"
    ) {
      const osmStation: OsmStation = {
        ...feature,
        children: feature.members
          .map((member) => {
            const osmMember = osmRaw.find(
              (f) => f.type === member.type && f.id === member.ref
            );
            if (osmMember) return osmMember;

            // else: this feature was not returned by the overpass query, so
            // it must be something irrelevant (e.g. a shelter). Only print a
            // warning if the role suggests that it's an important member.
            if (member.role === "stop") {
              console.warn(
                `(!) ${member.type} ${member.ref} is missing from OSM data but has a role of ${member.role}`
                  .yellow
              );
            }
            return undefined;
          })
          .filter((x): x is OsmFeature => !!x),
      };
      if (feature.tags!.ref) {
        osmStationsWithRef.set(feature.tags!.ref, osmStation);
      } else {
        osmStationsWithNoRef.push(osmStation);
      }
    }
  }

  const osmPatch: FeatureCollection = {
    type: "FeatureCollection",
    features: [],
    // @ts-expect-error -- part of the osmPatch spec
    size: "medium",
  };

  await withConfig(tempFolder, async (config) => {
    const stopsByRef = getOsmStopsByRef(osmRaw, config);

    for (const stationCode in gtfsStops.stations) {
      // if the user wants to skip this one, pretend it doesn't exist if
      if (config.ignoreStations?.includes(stationCode)) continue;

      const gtfsStation = gtfsStops.stations[stationCode];
      const expectedOsmMembers = [...new Set(gtfsStation.children)]
        .map((stopCode) => stopsByRef[stopCode])
        .filter(Boolean);

      // no point adding stations that only have one child
      if (expectedOsmMembers.length === 1) continue;

      const osmStation =
        osmStationsWithRef.get(stationCode) ||
        // if we can't find one with a match, try to find a matching one with no ref.
        // this is a much more expensive search
        osmStationsWithNoRef.find(
          (actualStation) =>
            expectedOsmMembers.length &&
            expectedOsmMembers.every((expectedMember) =>
              actualStation.children.some(
                (actualMember) =>
                  actualMember.id === expectedMember.id &&
                  actualMember.type === expectedMember.type
              )
            )
        );

      const tagChanges = conflateStationTags(
        config,
        osmStation?.tags || {},
        gtfsStation,
        stationCode
      );
      const memberChanges = conflateRelationMembers(
        osmStation?.members || [],
        expectedOsmMembers.map((feature) => ({
          type: feature.type,
          ref: feature.id,
          role: "stop",
        }))
      );

      const firstNode = expectedOsmMembers.find(
        (f): f is OsmNode => f.type === "node"
      )!;
      if (!firstNode) {
        console.warn(
          `No nodes in station ${stationCode} (${gtfsStation.name})`.yellow
        );
      }
      const geometry: Geometry = firstNode
        ? {
            type: "Polygon",
            coordinates: createDiamond({
              lat: firstNode.lat,
              lng: firstNode.lon,
            }),
          }
        : { type: "GeometryCollection", geometries: [] };

      if (osmStation) {
        // we found a match, so conflate its tags and members

        // if the only that needs changing is the name, skip it
        if (
          memberChanges.length === 0 &&
          Object.keys(tagChanges).join("|") === "official_name"
        ) {
          continue;
        }

        // if nothing needs changing, no edit
        if (
          memberChanges.length === 0 &&
          Object.keys(tagChanges).length === 0
        ) {
          continue;
        }

        osmPatch.features.push({
          type: "Feature",
          id: osmStation.type[0] + osmStation.id,
          // @ts-expect-error -- to make debugging easier
          __comment: `[${stationCode}] ${gtfsStation.name}`,
          geometry,
          properties: {
            __action: "edit",
            ...tagChanges,
            __members: memberChanges,
          },
        });
      } else if (memberChanges.length) {
        // no match found, so create a station
        // but not if there are no members, since that's impossible
        osmPatch.features.push({
          type: "Feature",
          id: stationCode,
          geometry,
          properties: {
            ...tagChanges,
            __members: memberChanges,
          },
        });
      }
    }
  });

  const seenIds = new Map<string | number | undefined, Feature>();
  for (const feature of osmPatch.features) {
    if (seenIds.has(feature.id)) {
      console.error(
        // @ts-expect-error -- to make debugging easier
        `Duplicate entry ${feature.id} (${feature.__comment} vs ${
          // @ts-expect-error -- to make debugging easier
          seenIds.get(feature.id)!.__comment
        })`.red
      );
    }
    seenIds.set(feature.id, feature);
  }

  const editCount = osmPatch.features.filter(
    (f) => f.properties?.__action === "edit"
  ).length;
  const missingCount = osmPatch.features.length - editCount;
  const total = Object.keys(gtfsStops.stations).length;
  const okayCount = total - missingCount - editCount;

  console.log(
    `Stations: ${okayCount} okay, ${missingCount} missing, ${editCount} wrong`
      .green
  );

  await fs.writeFile(
    join(tempFolder, "output", "stations.osmPatch.geo.json"),
    JSON.stringify(osmPatch, null, 2)
  );
}
