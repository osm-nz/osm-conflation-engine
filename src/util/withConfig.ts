import { promises as fs } from "fs";
import { join } from "path";
import { Config } from "../types";

// eslint-disable-next-line consistent-return -- false positive because exit() never returns
export async function withConfig<T>(
  tempFolder: string,
  cb: (config: Config) => Promise<T>
): Promise<T> {
  const configFilePath = join(tempFolder, "config.json");

  const config = await fs
    .readFile(configFilePath, "utf8")
    .then((str): Config => JSON.parse(str))
    .catch((): Config => ({}));

  try {
    const result = await cb(config);

    await fs.writeFile(configFilePath, JSON.stringify(config, null, 2));
    return result;
  } catch (ex) {
    console.error((ex as Error).stack?.red || ex);
    process.exit(1);
  }
}
