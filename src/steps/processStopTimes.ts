import csv from "csv-parser";
import { createReadStream, promises as fs } from "fs";
import { join } from "path";
import { Alight, StopTime } from "gtfs-types";
import type { RSNOutput } from "./readAgenciesRoutesAndTrips";

type FinalGTFSOutput = {
  [rsn: string]: {
    operators: string[];
    stopIds: Record<string, ("B" | "D" | "P")[]>;
  };
};

export async function processStopTimes(tempFolder: string) {
  console.log("processing stop times...");
  const output: FinalGTFSOutput = {};

  const rsnData: RSNOutput = JSON.parse(
    await fs.readFile(join(tempFolder, "rsn.json"), "utf8")
  );

  // build a reverse map of the RSNOutput data
  const tripIdToRSNMap: Record<string, string> = {};
  for (const rsn in rsnData) {
    for (const tripId of rsnData[rsn].tripIds) {
      tripIdToRSNMap[tripId] = rsn;
    }
  }

  await new Promise((resolve, reject) => {
    createReadStream(join(tempFolder, "gtfs", "stop_times.txt"))
      .pipe(csv())
      .on("data", (data: StopTime) => {
        const rsn = tripIdToRSNMap[data.trip_id];
        output[rsn] ||= {
          operators: rsnData[rsn].operators,
          stopIds: {},
        };
        const existing = output[rsn].stopIds[data.stop_id];
        const newCode =
          +data.drop_off_type! === Alight.NOT_AVAILABLE
            ? "D"
            : +data.pickup_type! === Alight.NOT_AVAILABLE
            ? "P"
            : "B";

        if (!existing) {
          output[rsn].stopIds[data.stop_id] = [newCode];
        } else if (!existing.includes(newCode)) {
          output[rsn].stopIds[data.stop_id].push(newCode);
        }
      })
      .on("end", resolve)
      .on("error", reject);
  });

  for (const rsn in output) {
    for (const stopId in output[rsn].stopIds) {
      const existing = output[rsn].stopIds[stopId];
      const B = existing.includes("B");
      const D = existing.includes("D");
      const P = existing.includes("P");
      // @ts-expect-error -- yeah this is a hack
      output[rsn].stopIds[stopId] =
        B || (D && P) ? "stop" : D ? "stop_exit_only" : "stop_entry_only";
    }
  }

  await fs.writeFile(
    join(tempFolder, "finalGtfsRouteData.json"),
    JSON.stringify(output, null, 2)
  );
}
