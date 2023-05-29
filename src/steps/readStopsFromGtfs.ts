import { promises as fs } from "fs";
import { join } from "path";
import { LocationType, Stop } from "gtfs-types";
import { BBox } from "../types";
import { csvToJsonObject, withConfig } from "../util";

export type StopsStationsOutput = {
  stops: {
    [ref: string]: {
      stopIds: string[];
      name: string;
      lat: number;
      lng: number;
      parentStationIds: string[];
      locRef: string | undefined;
    };
  };
  stations: {
    [ref: string]: {
      stationIds: string[];
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

    switch (+(stop.location_type ?? LocationType.STOP)) {
      case LocationType.STOP: {
        if (output.stops[stop.stop_code!]) {
          console.warn(`\tDuplicate stop ${stop.stop_code}`.yellow);
          output.stops[stop.stop_code!].stopIds.push(stop.stop_id);
        } else {
          output.stops[stop.stop_code!] = {
            lat: +stop.stop_lat!,
            lng: +stop.stop_lon!,
            name: stop.stop_name!,
            parentStationIds: [],
            stopIds: [stop.stop_id],
            locRef: stop.platform_code,
          };
        }
        if (
          stop.parent_station &&
          !output.stops[stop.stop_code!].parentStationIds.includes(
            stop.parent_station
          )
        ) {
          output.stops[stop.stop_code!].parentStationIds.push(
            stop.parent_station
          );
        }
        break;
      }

      case LocationType.STATION: {
        if (output.stations[stop.stop_code!]) {
          console.warn(`\tDuplicate station ${stop.stop_code}`.yellow);
          output.stations[stop.stop_code!].stationIds.push(stop.stop_id);
        } else {
          output.stations[stop.stop_code!] = {
            name: stop.stop_name!,
            stationIds: [stop.stop_id],
          };
        }
        break;
      }

      default:
        console.log(`\tSkipping node ${stop.location_type}`.yellow);
        break;
    }
  }

  await withConfig(tempFolder, async (config) => {
    config.bbox ||= bbox;
  });

  await fs.writeFile(
    join(tempFolder, "gtfsStops.json"),
    JSON.stringify(output, null, 2)
  );
}
