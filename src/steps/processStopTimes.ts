import csv from "csv-parser";
import { createReadStream, promises as fs } from "node:fs";
import { join } from "node:path";
import stripBOM from "strip-bom-stream";
import { Alight, StopTime, VehicleType } from "gtfs-types";
import type { RSNOutput } from "./readAgenciesRoutesAndTrips";

export type StopRole = "stop" | "stop_exit_only" | "stop_entry_only";

export type FinalGTFSOutput = {
  [rsna: string]: {
    vehicleType: VehicleType;
    rsn: string;
    rln: string | undefined;
    operators: string[];
    stopIds: {
      [stopId: string]: [type: StopRole, count: number];
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
        /**
         * index when the bus stops at this stop. usually a single item,
         * but a route could stop at the same stop twice
         */
        sequences: { sequence: number; tripId: string }[];
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
      .pipe(stripBOM())
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
            sequences: [],
          };
        } else if (!existing.codes.includes(newCode)) {
          output[rsna].stopIds[data.stop_id].codes.push(newCode);
        }
        output[rsna].stopIds[data.stop_id].sequences.push({
          sequence: +data.stop_sequence,
          tripId: data.trip_id,
        });
        output[rsna].stopIds[data.stop_id].count++;
      })
      .on("end", resolve)
      .on("error", reject);
  });

  for (const rsn in output) {
    // calculate min/max per trip
    const minMaxSequencesPerTrip: {
      [tripId: string]: [min: number, max: number];
    } = {};
    for (const { sequences } of Object.values(output[rsn].stopIds)) {
      for (const { sequence, tripId } of sequences) {
        minMaxSequencesPerTrip[tripId] ||= [Infinity, -Infinity];
        const [min, max] = minMaxSequencesPerTrip[tripId];
        if (sequence < min) minMaxSequencesPerTrip[tripId][0] = sequence;
        if (sequence > max) minMaxSequencesPerTrip[tripId][1] = sequence;
      }
    }

    for (const stopId in output[rsn].stopIds) {
      const { codes: existing, count, sequences } = output[rsn].stopIds[stopId];

      const sequencesAsPercent = sequences.map(({ sequence, tripId }) => {
        const [min, max] = minMaxSequencesPerTrip[tripId];
        return (sequence - min) / (max - min);
      });
      const B = existing.includes("B");
      const D = existing.includes("D");
      const P = existing.includes("P");
      let finalRole: StopRole =
        B || (D && P) ? "stop" : D ? "stop_entry_only" : "stop_exit_only";

      // if everytime that the vehicle only stops at this stop is the first
      // or last stop of the respsective trip, then override the role because it
      // should have been property set in the GTFS source data.
      if (sequencesAsPercent.every((n) => n === 0)) {
        finalRole = "stop_entry_only";
      }
      if (sequencesAsPercent.every((n) => n === 1)) {
        finalRole = "stop_exit_only";
      }

      (output as never as FinalGTFSOutput)[rsn].stopIds[stopId] = [
        finalRole,
        count,
      ];
    }
  }

  await fs.writeFile(
    join(tempFolder, "finalGtfsRouteData.json"),
    JSON.stringify(output, null, 2)
  );
}
