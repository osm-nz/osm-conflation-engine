import { join } from "node:path";
import { promises as fs } from "node:fs";
import { Agency, Route, Trip, VehicleType } from "gtfs-types";
import { csvToJsonObject, withConfig } from "../util";

export type RSNOutput = {
  [rsna: string]: {
    vehicleType: VehicleType;
    rsn: string;
    rln: string | undefined;
    operators: string[];
    tripIds: string[];
    shapeIds: string[];
  };
};

export async function readAgenciesRoutesAndTrips(tempFolder: string) {
  console.log("Reading agencies/routes/trips...");

  const agencies = await csvToJsonObject<Agency>(
    join(tempFolder, "gtfs", "agency.txt"),
    "agency_id"
  );
  const routes = await csvToJsonObject<Route>(
    join(tempFolder, "gtfs", "routes.txt"),
    "route_id"
  );
  const trips = await csvToJsonObject<Trip>(
    join(tempFolder, "gtfs", "trips.txt"),
    "route_id"
  );

  const output: RSNOutput = {};

  await withConfig(tempFolder, async (config) => {
    config.networkName ||= "Unknown";
    config.networkWikidata ||= "";
    config.operatorMap ||= {};

    for (const [route] of Object.values(routes)) {
      const agencyName = agencies[route.agency_id!][0].agency_name;

      const rsna = `${route.route_short_name!}|${agencyName}`;
      output[rsna] ||= {
        vehicleType:
          config.overrideTransportMode?.[route.route_short_name!] ||
          +route.route_type,
        rln: route.route_long_name,
        rsn: route.route_short_name!,
        operators: [],
        tripIds: [],
        shapeIds: [],
      };

      // if it's not defined in the config yet, add it
      config.operatorMap![agencyName] ||= { name: agencyName, wikidata: "" };

      const realOperator = config.operatorMap![agencyName];
      const operatorString = `${realOperator.name}🫶${realOperator.wikidata}`;

      const tripIds = trips[route.route_id]?.map((trip) => trip.trip_id);

      if (tripIds) {
        for (const tripId of tripIds) {
          if (!output[rsna].tripIds.includes(tripId)) {
            output[rsna].tripIds.push(tripId);
          }
        }
      } else {
        console.warn(`\tNo trips for route ${rsna} (${route.route_id})`.yellow);
      }

      const shapeIds = trips[route.route_id]
        ?.map((trip) => trip.shape_id)
        .filter((x): x is string => !!x);
      if (shapeIds) {
        for (const shapeId of shapeIds) {
          if (!output[rsna].shapeIds.includes(shapeId)) {
            output[rsna].shapeIds.push(shapeId);
          }
        }
      } else {
        console.warn(
          `\tNo shapes for route ${rsna} (${route.route_id})`.yellow
        );
      }

      if (!output[rsna].operators.includes(operatorString)) {
        output[rsna].operators.push(operatorString);
      }
    }
  });

  await fs.writeFile(
    join(tempFolder, "rsn.json"),
    JSON.stringify(output, null, 2)
  );
}
