import { promises as fs } from "node:fs";
import { join } from "node:path";
import type { OsmFeature, OsmFeatureType, OsmRelation } from "osm-api";
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
    for (const rsna in gtfsRouteData) {
      const gtfsRoute = gtfsRouteData[rsna];
      const routeTagValue = getRouteTagForTransportMode(gtfsRoute.vehicleType);

      if (config.ignoreRoutes?.includes(gtfsRoute.rsn)) continue;

      const candiateOsmRoutes = osmRaw
        .filter(
          (el): el is OsmRelation =>
            el.type === "relation" &&
            el.tags?.type === "route" &&
            el.tags.route === routeTagValue &&
            el.tags.ref === gtfsRoute.rsn
        )
        .map((el) => ({
          ...el,
          score:
            el.tags?.network === config.networkName
              ? 2
              : el.tags?.network
              ? 0 // any other network value
              : 1,
        }))
        .sort((a, b) => b.score - a.score);

      const bestScore = candiateOsmRoutes[0]?.score;
      const numberWithSameScore = candiateOsmRoutes.filter(
        (x) => x.score === bestScore
      ).length;

      if (numberWithSameScore > 1) {
        console.log(
          `Skipping ${rsna} as there are multiple similar route relations`.cyan
        );
        continue;
      } else if (candiateOsmRoutes.length > 1) {
        console.log(`Multiple routes for ${rsna}, but found the best one`.cyan);
      }

      const osmRoute = candiateOsmRoutes[0];

      let lastStop: StopsStationsOutput["stops"][string] | null = null;

      // the stop with the most amount of trips that stop there
      const maxCount = Math.max(
        ...Object.values(gtfsRoute.stopIds).map(([, count]) => count)
      );

      const expectedOsmStopsString: (string | undefined)[] = Object.entries(
        gtfsRoute.stopIds
      ).map(([stopId, [relationRole, count]]) => {
        if ((count / maxCount) * 100 < 10) {
          // less than 10% of trips stop here, so it must be a special
          // stop e.g. the night-bus version of the 82
          return undefined;
        }

        // find the stopCode for this stopId
        let stopCode = Object.entries(gtfsStops.stops).find(([, v]) =>
          v.stopIds.includes(stopId)
        )?.[0];

        if (stopCode && stopCode in config.ignoreStops!) {
          stopCode = config.ignoreStops![stopCode] || undefined;
        }

        const gtfsStop = stopCode && gtfsStops.stops[stopCode];

        if (!stopCode || !gtfsStop) {
          throw new Error(
            `Couldn't find a stop in OSM for stopId=${stopId}, but we need one for route ${rsna}`
          );
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

        return `${osmStop.type}|${osmStop.id}|${relationRole}`;
      });

      // required to filter out duplicate stopIds
      const expectedOsmStops: OsmRelation["members"] = [
        ...new Set(expectedOsmStopsString.filter((x): x is string => !!x)),
      ].map((string) => {
        const [type, ref, role] = string.split("|");
        return { type: type as OsmFeatureType, ref: +ref, role };
      });

      // just to keep TS happy
      if (!lastStop) throw new Error("Something went wrong");

      if (osmRoute) {
        if (
          osmRoute.tags?.network &&
          osmRoute.tags.network !== config.networkName
        ) {
          console.warn(
            `Route ${rsna} has invalid network ${osmRoute.tags.network}`.red
          );
        }

        // 1. Check tags on the route relation
        const tagChanges = conflateRouteTags(config, osmRoute.tags!, gtfsRoute);

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
            __comment: rsna,
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
        console.warn(`No route relation for ${rsna}`.yellow);
        const newRoute: Feature = {
          type: "Feature",
          id: rsna,
          geometry: {
            type: "GeometryCollection",
            geometries: [],
          },
          properties: {
            type: "route",
            ...conflateRouteTags(config, {}, gtfsRoute),
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
  const total = Object.keys(gtfsRouteData).length;
  const okayCount = total - missingCount - editCount;

  console.log(
    `Routes: ${okayCount} okay, ${missingCount} missing, ${editCount} wrong`
      .green
  );

  await fs.writeFile(
    join(tempFolder, "output", "routes.osmPatch.geo.json"),
    JSON.stringify(osmPatch, null, 2)
  );
}
