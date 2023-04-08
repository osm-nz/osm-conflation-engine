import { promises as fs } from "node:fs";
import { join } from "node:path";
import type { OsmFeature, OsmRelation } from "osm-api";
import type { Feature, FeatureCollection } from "geojson";
import type { FinalGTFSOutput } from "../processStopTimes";
import type { StopsStationsOutput } from "../readStopsFromGtfs";
import { getRouteTagForTransportMode } from "../../constants";
import { conflateRouteMembers, conflateRouteTags } from "./tags";
import { createDiamond, distanceBetween, withConfig } from "../../util";

export async function conflateRoutes(tempFolder: string) {
  const gtfsRouteData: FinalGTFSOutput = JSON.parse(
    await fs.readFile(join(tempFolder, "finalGtfsRouteData.json"), "utf8")
  );
  const gtfsStops: StopsStationsOutput = JSON.parse(
    await fs.readFile(join(tempFolder, "gtfsStops.json"), "utf8")
  );

  const osmRaw: OsmFeature[] = JSON.parse(
    await fs.readFile(join(tempFolder, "osmRaw.json"), "utf8")
  );

  const osmPatch: FeatureCollection = {
    type: "FeatureCollection",
    features: [],
    // @ts-expect-error -- part of the osmPatch spec
    size: "medium",
  };

  await withConfig(tempFolder, async (config) => {
    for (const rsn in gtfsRouteData) {
      const gtfsRoute = gtfsRouteData[rsn];
      const routeTagValue = getRouteTagForTransportMode(gtfsRoute.vehicleType);

      const osmRoute = osmRaw.find(
        (el): el is OsmRelation =>
          el.type === "relation" &&
          el.tags?.type === "route" &&
          el.tags.route === routeTagValue &&
          el.tags.ref === rsn
      );

      let lastStop: StopsStationsOutput["stops"][string] | null = null;

      const expectedOsmStops: OsmRelation["members"] = Object.entries(
        gtfsRoute.stopIds
      ).map(([stopId, relationRole]) => {
        // find the stopCode for this stopId
        let stopCode = Object.entries(gtfsStops.stops).find(([, v]) =>
          v.stopIds.includes(stopId)
        )?.[0];

        if (stopCode && stopCode in config.ignoreStops!) {
          stopCode = config.ignoreStops![stopCode];
        }

        const gtfsStop = stopCode && gtfsStops.stops[stopCode];

        if (!stopCode || !gtfsStop) {
          throw new Error(`Couldn't find stop for ${stopId}`);
        }
        lastStop = gtfsStop;

        const osmStop = osmRaw
          .filter((f) => f.tags?.ref === stopCode)
          .map((f) => ({
            ...f,
            distance:
              f.type === "node"
                ? distanceBetween(f.lat, f.lon, gtfsStop.lat, gtfsStop.lng)
                : 0.123, // can't easily compute distance for non-nodes
          }))
          .sort((a, b) => a.distance - b.distance)[0];

        if (!osmStop) {
          throw new Error(`Couldn't find stop ${stopCode} in OSM`);
        }

        return { type: osmStop.type, ref: osmStop.id, role: relationRole };
      });

      // just to keep TS happy
      if (!lastStop) throw new Error("Something went wrong");

      if (osmRoute) {
        // 1. Check tags on the route relation
        const tagChanges = conflateRouteTags(
          config,
          osmRoute.tags!,
          gtfsRoute,
          rsn
        );

        // 2. Check stops within the route
        const memberChanges = conflateRouteMembers(
          osmRoute.members,
          expectedOsmStops
        );

        if (Object.keys(tagChanges).length || memberChanges.length) {
          osmPatch.features.push({
            type: "Feature",
            id: osmRoute.type[0] + osmRoute.id,
            // @ts-expect-error -- to make debugging easier
            __comment: rsn,
            geometry: {
              type: "Polygon",
              coordinates: createDiamond(lastStop),
            },
            properties: {
              __action: "edit",
              ...tagChanges,
              __members: memberChanges,
            },
          });
        }
      } else {
        console.warn(`No route relation for ${rsn}`.yellow);
        const newRoute: Feature = {
          type: "Feature",
          id: rsn,
          geometry: {
            type: "GeometryCollection",
            geometries: [],
          },
          properties: {
            type: "route",
            route: routeTagValue,
            ref: rsn,

            network: config.networkName,
            "network:wikidata": config.networkWikidata,

            operator:
              gtfsRoute.operators.map((op) => op.split("🫶")[0]).join(";") ||
              undefined,
            "operator:wikidata":
              gtfsRoute.operators.map((op) => op.split("🫶")[1]).join(";") ||
              undefined,

            __members: expectedOsmStops,
          },
        };
        osmPatch.features.push(newRoute);
      }
    }
  });

  const editCount = osmPatch.features.filter(
    (f) => f.properties?.__action === "edit"
  ).length;
  const missingCount = osmPatch.features.length - editCount;

  console.log(`Routes: ${editCount} wrong, ${missingCount} missing`.green);

  await fs.writeFile(
    join(tempFolder, "output", "routes.osmPatch.geo.json"),
    JSON.stringify(osmPatch, null, 2)
  );
}
