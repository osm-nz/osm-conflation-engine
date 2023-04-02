import { join } from "path";
import { promises as fs } from "fs";
import { Agency, Route, Trip } from "gtfs-types";
import { csvToJsonObject, withConfig } from "../util";

export type RSNOutput = {
  [rsn: string]: {
    operators: string[];
    tripIds: string[];
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
      const rsn = route.route_short_name!;
      output[rsn] ||= {
        operators: [],
        tripIds: [],
      };

      const agencyName = agencies[route.agency_id!][0].agency_name;

      // if it's not defined in the config yet, add it
      config.operatorMap![agencyName] ||= { name: agencyName, wikidata: "" };

      const realOperator = config.operatorMap![agencyName];
      const operatorString = `${realOperator.name}🫶${realOperator.wikidata}`;

      const tripIds = trips[route.route_id]?.map((trip) => trip.trip_id);

      if (tripIds) {
        for (const tripId of tripIds) {
          if (!output[rsn].tripIds.includes(tripId)) {
            output[rsn].tripIds.push(tripId);
          }
        }
      } else {
        console.warn(`\tNo trips for route ${rsn} (${route.route_id})`);
      }

      if (!output[rsn].operators.includes(operatorString)) {
        output[rsn].operators.push(operatorString);
      }
    }
  });

  await fs.writeFile(
    join(tempFolder, "rsn.json"),
    JSON.stringify(output, null, 2)
  );
}
