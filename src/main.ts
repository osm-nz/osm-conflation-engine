import { promises as fs } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import {
  conflateRoutes,
  conflateStations,
  conflateStops,
  downloadZip,
  fetchDataFromOsm,
  processStopTimes,
  readAgenciesRoutesAndTrips,
  readStopsFromGtfs,
  shapeToGeoJson,
  unzipGtfsFile,
} from "./steps";

async function doesFileExist(fileOrFolder: string) {
  try {
    await fs.access(fileOrFolder);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const url = process.argv[2];

  const cityId = `${new URL(url).hostname.replaceAll(/\W+/g, "-")}-${createHash(
    "sha256"
  )
    .update(url)
    .digest("hex")
    .slice(0, 6)}`;

  console.log("🚌", cityId);

  const tempFolder = join(__dirname, "../tmp", cityId);

  // 0. create temp folder
  await fs.mkdir(join(tempFolder, "output"), { recursive: true });

  // 1. download GTFS zip
  const alreadyDownloaded = await doesFileExist(join(tempFolder, "gtfs.zip"));

  if (alreadyDownloaded) {
    console.log("Already downloaded GTFS zip file".blue);
  } else {
    await downloadZip(tempFolder, url);
  }

  // 2. unzip GTFS file
  const alreadyUnzipped = await doesFileExist(join(tempFolder, "gtfs"));
  if (alreadyUnzipped) {
    console.log("Already extracted GTFS zip file".blue);
  } else {
    await unzipGtfsFile(tempFolder);
  }

  // 3. read routes.txt & agency.txt
  const alreadyReadRSNs = await doesFileExist(join(tempFolder, "rsn.json"));
  if (alreadyReadRSNs) {
    console.log("Already extracted agencies/routes/trips".blue);
  } else {
    await readAgenciesRoutesAndTrips(tempFolder);
  }

  // 4. read stops.txt
  const alreadyReadStops = await doesFileExist(
    join(tempFolder, "gtfsStops.json")
  );
  if (alreadyReadStops) {
    console.log("Already extracted stops from GTFS".blue);
  } else {
    await readStopsFromGtfs(tempFolder);
  }

  // 5. download data from OSM
  const alreadyDownloadedOsmData = await doesFileExist(
    join(tempFolder, "osmRaw.json")
  );
  if (alreadyDownloadedOsmData) {
    console.log("Already downloaded data from OSM".blue);
  } else {
    await fetchDataFromOsm(tempFolder);
  }

  // 6. process stop_times.txt
  const alreadyProcessedStopTimes = await doesFileExist(
    join(tempFolder, "finalGtfsRouteData.json")
  );
  if (alreadyProcessedStopTimes) {
    console.log("Already processed stop times".blue);
  } else {
    await processStopTimes(tempFolder);
  }

  // 7. Generate geojson files from shapes.txt
  await shapeToGeoJson(tempFolder);

  //
  // now we have everything, we can finally conflate the data.
  //

  // 8. Conflate stops
  await conflateStops(tempFolder);

  // 9. Conflate stations
  await conflateStations(tempFolder);

  // 10. Conflate routes
  await conflateRoutes(tempFolder);
}

main();
