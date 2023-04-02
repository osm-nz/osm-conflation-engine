import { promises as fs } from "fs";
import { join } from "path";
import { LocationType, Stop } from "gtfs-types";
import { BBox } from "../types";
import { csvToJsonObject, withConfig } from "../util";

export type StopsStationsOutput = {
  stops: {
    [ref: string]: {
      stopId: string;
      name: string;
      lat: number;
      lng: number;
      parentStationId: string | undefined;
      locRef: string | undefined;
    };
  };
  stations: {
    [ref: string]: {
      stationId: string;
      name: string;
    };
  };
};

export async function readStopsFromGtfs(tempFolder: string) {
  console.log("Reading stops...");

  const stops = await csvToJsonObject<Stop>(
    join(tempFolder, "gtfs", "stops.txt"),
    "stop_id"
  );

  const output: StopsStationsOutput = { stops: {}, stations: {} };

  const bbox: BBox = {
    maxLat: -Infinity,
    minLat: Infinity,
    minLng: Infinity,
    maxLng: -Infinity,
  };

  for (const [stop] of Object.values(stops)) {
    // update the bbox
    if (+stop.stop_lat! > bbox.maxLat) bbox.maxLat = +stop.stop_lat!;
    if (+stop.stop_lat! < bbox.minLat) bbox.minLat = +stop.stop_lat!;
    if (+stop.stop_lon! > bbox.maxLng) bbox.maxLng = +stop.stop_lon!;
    if (+stop.stop_lon! < bbox.minLng) bbox.minLng = +stop.stop_lon!;

    switch (+stop.location_type!) {
      case LocationType.STOP: {
        if (output.stops[stop.stop_code!]) {
          console.warn("\tDuplicate stop", stop.stop_code);
        }
        output.stops[stop.stop_code!] = {
          lat: +stop.stop_lat!,
          lng: +stop.stop_lon!,
          name: stop.stop_name!,
          parentStationId: stop.parent_station,
          stopId: stop.stop_id,
          locRef: stop.platform_code,
        };
        break;
      }

      case LocationType.STATION: {
        if (output.stations[stop.stop_code!]) {
          console.warn("\tDuplicate station", stop.stop_code);
        }
        output.stations[stop.stop_code!] = {
          name: stop.stop_name!,
          stationId: stop.stop_id,
        };
        break;
      }

      default:
        console.log("\tSkipping node", stop.location_type);
        break;
    }
  }

  await withConfig(tempFolder, (config) => {
    config.bbox ||= bbox;
  });

  await fs.writeFile(
    join(tempFolder, "gtfsStops.json"),
    JSON.stringify(output, null, 2)
  );
}
