import csv from "csv-parser";
import { createReadStream, promises as fs } from "fs";
import { join } from "path";
import { Alight, StopTime, VehicleType } from "gtfs-types";
import type { RSNOutput } from "./readAgenciesRoutesAndTrips";

export type FinalGTFSOutput = {
  [rsna: string]: {
    vehicleType: VehicleType;
    rsn: string;
    rln: string | undefined;
    operators: string[];
    stopIds: {
      [stopId: string]: [
        type: "stop" | "stop_exit_only" | "stop_entry_only",
        count: number
      ];
    };
  };
};

type PreFinalGTFSOutput = {
  [rsna: string]: {
    vehicleType: VehicleType;
    rsn: string;
    rln: string | undefined;
    operators: string[];
    stopIds: {
      [stopId: string]: {
        count: number;
        codes: ("B" | "D" | "P")[];
      };
    };
  };
};

export async function processStopTimes(tempFolder: string) {
  console.log("processing stop times...");
  const output: PreFinalGTFSOutput = {};

  const rsnData: RSNOutput = JSON.parse(
    await fs.readFile(join(tempFolder, "rsn.json"), "utf8")
  );

  // build a reverse map of the RSNOutput data
  const tripIdToRSNAMap: Record<string, string> = {};
  for (const rsna in rsnData) {
    for (const tripId of rsnData[rsna].tripIds) {
      tripIdToRSNAMap[tripId] = rsna;
    }
  }

  await new Promise((resolve, reject) => {
    createReadStream(join(tempFolder, "gtfs", "stop_times.txt"))
      .pipe(csv())
      .on("data", (data: StopTime) => {
        const rsna = tripIdToRSNAMap[data.trip_id];
        output[rsna] ||= {
          vehicleType: rsnData[rsna].vehicleType,
          rsn: rsnData[rsna].rsn,
          rln: rsnData[rsna].rln,
          operators: rsnData[rsna].operators,
          stopIds: {},
        };
        const existing = output[rsna].stopIds[data.stop_id];
        const newCode =
          +data.drop_off_type! === Alight.NOT_AVAILABLE
            ? "D"
            : +data.pickup_type! === Alight.NOT_AVAILABLE
            ? "P"
            : "B";

        if (!existing) {
          output[rsna].stopIds[data.stop_id] = {
            codes: [newCode],
            count: 0,
          };
        } else if (!existing.codes.includes(newCode)) {
          output[rsna].stopIds[data.stop_id].codes.push(newCode);
        }
        output[rsna].stopIds[data.stop_id].count++;
      })
      .on("end", resolve)
      .on("error", reject);
  });

  for (const rsn in output) {
    for (const stopId in output[rsn].stopIds) {
      const { codes: existing, count } = output[rsn].stopIds[stopId];
      const B = existing.includes("B");
      const D = existing.includes("D");
      const P = existing.includes("P");
      (output as never as FinalGTFSOutput)[rsn].stopIds[stopId] = [
        B || (D && P) ? "stop" : D ? "stop_entry_only" : "stop_exit_only",
        count,
      ];
    }
  }

  await fs.writeFile(
    join(tempFolder, "finalGtfsRouteData.json"),
    JSON.stringify(output, null, 2)
  );
}
