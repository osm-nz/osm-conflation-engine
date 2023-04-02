import { promises as fs } from "fs";
import { join } from "path";
import type { OsmFeature } from "osm-api";
import type { Feature, FeatureCollection } from "geojson";
import type { StopsStationsOutput } from "../readStopsFromGtfs";
import { withConfig, distanceBetween, createDiamond } from "../../util";
import { conflateBusStopTags } from "./tags";

/**
 * This is straightforward, no relations to deal with.
 * Just looking at the tags on each node.
 */
export async function conflateStops(tempFolder: string) {
  const gtfsStops: StopsStationsOutput = JSON.parse(
    await fs.readFile(join(tempFolder, "gtfsStops.json"), "utf8")
  );

  const osmRaw: OsmFeature[] = JSON.parse(
    await fs.readFile(join(tempFolder, "osmRaw.json"), "utf8")
  );

  await withConfig(tempFolder, async (config) => {
    const skipBecauseDuplicateRef: Record<string, true> = {};

    const osmRawByRef: Record<string, OsmFeature> = {};
    for (const feature of osmRaw) {
      if (feature.tags?.highway === "bus_stop" && feature.tags.ref) {
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

          if (bothHaveNoNetwork || bothHaveCorrectNetwork) {
            // no straightforward solution here so print a warning
            console.warn(
              `Multiple OSM bus stops have ref=${feature.tags.ref} (${feature.id} & ${existing.id})`
            );
            skipBecauseDuplicateRef[feature.tags.ref] = true;
          } else {
            const preferOld = !oldNetwork || oldNetwork === config.networkName;
            const preferNew = !newNetwork || newNetwork === config.networkName;

            if (preferOld) {
              // prefer the existing one, so do nothing
            } else if (preferNew) {
              osmRawByRef[feature.tags.ref] = feature;
            } else {
              console.warn(
                `Multiple OSM bus stops have ref=${feature.tags.ref} (${feature.id} & ${existing.id}) and have incorrect network tags`
              );
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
    };
    const osmPatchWrong: FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };

    for (const stopCode in gtfsStops.stops) {
      const gtfsItem = gtfsStops.stops[stopCode];
      const osmItem = osmRawByRef[stopCode];

      const fallback: Feature = {
        type: "Feature",
        id: stopCode,
        geometry: {
          type: "Point",
          coordinates: [gtfsItem.lng, gtfsItem.lat],
        },
        properties: {
          highway: "bus_stop",
          public_transport: "platform",
          bus: "yes",
          network: config.networkName,
          "network:wikidata": config.networkWikidata,

          ref: stopCode,
          name: gtfsItem.name,
          local_ref: gtfsItem.locRef,
        },
      };

      if (osmItem) {
        // this is a good start, the bus stop already exists in OSM.

        // reject tagless nodes
        if (!osmItem.tags) continue;

        // reject non-nodes
        if (osmItem.type !== "node") {
          console.log(
            `\tnon-node tagged as a bus stop: https:/osm.org/${osmItem.type}/${osmItem.id}`
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
          ) < 500;

        if (osmItemIsPrettyClose) {
          const tagChanges = conflateBusStopTags(
            config,
            osmItem.tags,
            gtfsItem
          );

          // no point editting a node just to "upgrade tags"
          const anyMeaningfulChanges =
            Object.keys(tagChanges).length &&
            (tagChanges.name ||
              tagChanges.official_name ||
              tagChanges.local_ref);

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
            // this bus stop is perfect
          }
        } else {
          // bus stop is too way away to conceively be the one we're looking for.
          // so suggest creating a new one
          osmPatchMissing.features.push(fallback);
        }
      } else {
        // bus stop does not exist in OSM -> so suggest creating it
        osmPatchMissing.features.push(fallback);
      }
    }

    const missing = osmPatchMissing.features.length;
    const wrong = osmPatchWrong.features.length;
    const okay = Object.keys(gtfsStops.stops).length - missing - wrong;
    console.log(`\t${okay} okay, ${missing} mising, ${wrong} wrong`);

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
