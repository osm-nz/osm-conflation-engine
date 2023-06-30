import { exec } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function downloadZip(tempFolder: string, urlToZipFile: string) {
  console.log(`Downloading from ${urlToZipFile}...`);

  const pathOnDisk = join(tempFolder, "gtfs.zip");

  const { stdout, stderr } = await execAsync(
    `curl "${urlToZipFile}" -Lo ${pathOnDisk}`
  );
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr.red);
}
