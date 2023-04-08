import { promises as fs } from "fs";
import { join } from "path";
import type { OsmFeature } from "osm-api";
import type { Feature, FeatureCollection } from "geojson";
import { VehicleType } from "gtfs-types";
import type { StopsStationsOutput } from "../readStopsFromGtfs";
import type { FinalGTFSOutput } from "../processStopTimes";
import { withConfig, distanceBetween, createDiamond } from "../../util";
import { conflateStopTags, transformName } from "./tags";
import { getStopTagsForTransportMode } from "../../constants";

/**
 * This is straightforward, no relations to deal with.
 * Just looking at the tags on each node.
 */
export async function conflateStops(tempFolder: string) {
  const gtfsStops: StopsStationsOutput = JSON.parse(
    await fs.readFile(join(tempFolder, "gtfsStops.json"), "utf8")
  );

  const gtfsRouteData: FinalGTFSOutput = JSON.parse(
    await fs.readFile(join(tempFolder, "finalGtfsRouteData.json"), "utf8")
  );

  // store which stops are actually in use, so that we don't add disused ones.
  // also store the stop's mode of transport.
  const stopsInUse: Record<string, VehicleType> = {};
  for (const rsn in gtfsRouteData) {
    for (const stopId in gtfsRouteData[rsn].stopIds) {
      stopsInUse[stopId] = gtfsRouteData[rsn].vehicleType;
    }
  }

  const osmRaw: OsmFeature[] = JSON.parse(
    await fs.readFile(join(tempFolder, "osmRaw.json"), "utf8")
  );

  await withConfig(tempFolder, async (config) => {
    const skipBecauseDuplicateRef: Record<string, true> = {};

    const osmRawByRef: Record<string, OsmFeature> = {};
    for (const feature of osmRaw) {
      const isStop =
        feature.tags?.highway === "bus_stop" ||
        feature.tags?.public_transport === "platform" ||
        feature.tags?.public_transport === "stop_position";

      if (isStop && feature.tags?.ref) {
        const existing = osmRawByRef[feature.tags.ref];
        if (existing) {
          // if we find a duplicate, prefer the one with the correct network tag,
          // or no network tag. If this doesn't resolve the ambiguity, then warn
          const oldNetwork = existing.tags?.network || "";
          const newNetwork = feature.tags?.network || "";

          const bothHaveNoNetwork = !oldNetwork && !newNetwork;
          const bothHaveCorrectNetwork =
            oldNetwork === config.networkName &&
            newNetwork === config.networkName;

          // it's common that there'll be duplicates for ref=1, ref=2 etc.
          const noWarning =
            !Number.isNaN(+feature.tags.ref) && +feature.tags.ref < 100;

          if (bothHaveNoNetwork || bothHaveCorrectNetwork) {
            // no straightforward solution here so print a warning
            if (!noWarning) {
              console.warn(
                `Multiple OSM stops have ref=${feature.tags.ref} (${feature.id} & ${existing.id})`
                  .yellow
              );
            }
            skipBecauseDuplicateRef[feature.tags.ref] = true;
          } else {
            const oldRanking =
              oldNetwork === config.networkName ? 2 : !oldNetwork ? 1 : 0;
            const newRanking =
              newNetwork === config.networkName ? 2 : !newNetwork ? 1 : 0;

            if (oldRanking > newRanking) {
              // prefer the existing one, so do nothing
            } else if (newRanking > oldRanking) {
              // prefer the new one
              osmRawByRef[feature.tags.ref] = feature;
            } else {
              // no straightforward solution
              if (!noWarning) {
                console.warn(
                  `Multiple OSM stops have ref=${feature.tags.ref} (${feature.id} & ${existing.id}) and have incorrect network tags`
                    .yellow
                );
              }
              skipBecauseDuplicateRef[feature.tags.ref] = true;
            }
          }
        } else {
          // no duplicate - so just add it
          osmRawByRef[feature.tags.ref] = feature;
        }
      }
    }

    for (const stopCode in skipBecauseDuplicateRef) {
      delete osmRawByRef[stopCode];
    }

    const osmPatchMissing: FeatureCollection = {
      type: "FeatureCollection",
      features: [],
      // @ts-expect-error -- part of the osmPatch spec
      size: "medium",
    };
    const osmPatchWrong: FeatureCollection = {
      type: "FeatureCollection",
      features: [],
      // @ts-expect-error -- part of the osmPatch spec
      size: "medium",
    };

    let disused = 0;

    config.ignoreStops ||= {};

    for (const stopCode in gtfsStops.stops) {
      const gtfsItem = gtfsStops.stops[stopCode];
      const osmItem = osmRawByRef[stopCode];

      // don't import stops that the user wants to ignore
      if (stopCode in config.ignoreStops) continue;

      // try to find the stopId that's acutally in use
      const firstStopId =
        gtfsItem.stopIds.find((stopId) => stopId in stopsInUse) ||
        gtfsItem.stopIds[0];

      const modeOfTransport: VehicleType | undefined = stopsInUse[firstStopId];

      if (typeof modeOfTransport === "undefined") {
        // skip stops that are not used by any routes.
        // this is a design decision but also a technical
        // limitation because we need at least 1 route to
        // determine the mode of transport for the stop.
        disused++;
        continue;
      }

      const fallback: Feature = {
        type: "Feature",
        id: stopCode,
        geometry: {
          type: "Point",
          coordinates: [gtfsItem.lng, gtfsItem.lat],
        },
        properties: {
          ...getStopTagsForTransportMode(modeOfTransport),
          network: config.networkName,
          "network:wikidata": config.networkWikidata,

          ref: stopCode,
          name: transformName(gtfsItem.name),
          loc_ref: gtfsItem.locRef || undefined,
        },
      };

      if (osmItem?.tags) {
        // this is a good start, the stop already exists in OSM.

        // skip non-nodes, we can't conflate them if anything is wrong
        if (osmItem.type !== "node") {
          console.warn(
            `can’t conflate non-node tagged as a stop: https://osm.org/${osmItem.type}/${osmItem.id}`
              .yellow
          );
          continue;
        }

        // within 500m
        const osmItemIsPrettyClose =
          distanceBetween(
            gtfsItem.lat,
            gtfsItem.lng,
            osmItem.lat,
            osmItem.lon
          ) < 400; // 400m is what the java research paper used

        if (osmItemIsPrettyClose) {
          const tagChanges = conflateStopTags(
            config,
            osmItem.tags,
            modeOfTransport,
            gtfsItem,
            stopCode
          );

          // no point editing a node just to "upgrade tags"
          const anyMeaningfulChanges =
            Object.keys(tagChanges).length &&
            (tagChanges.name || tagChanges.official_name || tagChanges.loc_ref);

          if (anyMeaningfulChanges) {
            // some tags need changing
            osmPatchWrong.features.push({
              type: "Feature",
              id: osmItem.type[0] + osmItem.id,
              geometry: {
                type: "Polygon",
                coordinates: createDiamond({
                  lat: osmItem.lat,
                  lng: osmItem.lon,
                }),
              },
              properties: { __action: "edit", ...tagChanges },
            });
          } else {
            // this stop is perfect
          }
        } else {
          // stop is too way away to conceively be the one we're looking for.
          // so suggest creating a new one
          osmPatchMissing.features.push(fallback);
        }
      } else {
        // stop does not exist in OSM -> so suggest creating it
        osmPatchMissing.features.push(fallback);
      }
    }

    const missing = osmPatchMissing.features.length;
    const wrong = osmPatchWrong.features.length;
    const okay = Object.keys(gtfsStops.stops).length - missing - wrong;
    console.log(
      `Stops: ${okay} okay, ${missing} missing, ${wrong} wrong, ${disused} missing but disused`
        .green
    );

    await fs.writeFile(
      join(tempFolder, "output", "stops-missing.osmPatch.geo.json"),
      JSON.stringify(osmPatchMissing, null, 2)
    );
    await fs.writeFile(
      join(tempFolder, "output", "stops-wrong.osmPatch.geo.json"),
      JSON.stringify(osmPatchWrong, null, 2)
    );

    if (missing) {
      throw new Error(
        "Some stops are missing, so you can't continue the conflation" +
          " process until all required stopped are mapped. Upload the " +
          " stops-missing.osmPatch.geo.json file, then re-run the script."
      );
    }
  });
}
