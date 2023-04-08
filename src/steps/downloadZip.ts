import { exec } from "child_process";
import { join } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function downloadZip(tempFolder: string, urlToZipFile: string) {
  console.log(`Downloading from ${urlToZipFile}...`);

  const pathOnDisk = join(tempFolder, "gtfs.zip");

  const { stdout, stderr } = await execAsync(
    `curl "${urlToZipFile}" -o ${pathOnDisk}`
  );
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr.red);
}
