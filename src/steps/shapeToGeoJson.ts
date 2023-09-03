import csv from "csv-parser";
import { createReadStream, promises as fs } from "node:fs";
import { join } from "node:path";
import stripBOM from "strip-bom-stream";
import type { Shapes } from "gtfs-types";
import type { FeatureCollection } from "geojson";
import type { RSNOutput } from "./readAgenciesRoutesAndTrips";

type Coord = [lng: number, lat: number];

export async function shapeToGeoJson(tempFolder: string) {
  const alreadyExists = await fs
    .access(join(tempFolder, "shapes"))
    .then(() => true)
    .catch(() => false);

  if (alreadyExists) {
    console.log("Shapes already generated");
    return;
  }

  console.log("processing shapes...");
  const output: { [rsna: string]: { [shapeId: string]: Coord[] } } = {};

  const rsnData: RSNOutput = JSON.parse(
    await fs.readFile(join(tempFolder, "rsn.json"), "utf8")
  );

  // build a reverse map of the RSNOutput data
  const shapeIdToRSNAMap: Record<string, string> = {};
  for (const rsna in rsnData) {
    for (const shapeId of rsnData[rsna].shapeIds) {
      shapeIdToRSNAMap[shapeId] = rsna;
    }
  }

  await new Promise((resolve, reject) => {
    createReadStream(join(tempFolder, "gtfs", "shapes.txt"))
      .pipe(stripBOM())
      .pipe(csv())
      .on("data", (data: Shapes) => {
        const rsna = shapeIdToRSNAMap[data.shape_id];
        output[rsna] ||= {};
        output[rsna][data.shape_id] ||= [];
        output[rsna][data.shape_id][data.shape_pt_sequence] = [
          +data.shape_pt_lon,
          +data.shape_pt_lat,
        ];
      })
      .on("end", resolve)
      .on("error", reject);
  });

  await fs.mkdir(join(tempFolder, "shapes"), { recursive: true });

  for (const rsna in output) {
    const geojson: FeatureCollection = {
      type: "FeatureCollection",
      features: [],
    };
    for (const shapeId in output[rsna]) {
      const geom = output[rsna][shapeId].filter(Boolean);
      geojson.features.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: geom },
        properties: { rsna, shapeId },
      });
    }
    await fs.writeFile(
      join(tempFolder, "shapes", `${rsna.replace("|", "__")}.geo.json`),
      JSON.stringify(geojson, null, 2)
    );
  }
}
