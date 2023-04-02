import { createReadStream } from "fs";
import { join } from "path";
import { Extract } from "unzip-stream";

export function unzipGtfsFile(tempFolder: string) {
  console.log("Unzipping GTFS file...");

  const zipPath = join(tempFolder, "gtfs.zip");
  const folderPath = join(tempFolder, "gtfs");

  return new Promise((resolve, reject) => {
    createReadStream(zipPath)
      .pipe(Extract({ path: folderPath }))
      .on("close", resolve)
      .on("error", reject);
  });
}
