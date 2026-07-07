import { createReadStream, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';

/** reads JSONL by parsing one line at a time */
export async function readJsonL<T, U extends string>(
  filePath: string,
  getKey: (row: T) => U,
): Promise<Record<U, T>> {
  const fileStream = createReadStream(filePath);
  const rl = createInterface({ input: fileStream });

  const rows = {} as Record<U, T>;
  for await (const line of rl) {
    const row = JSON.parse(line);
    const key = getKey(row);
    rows[key] = row;
  }
  return rows;
}

/** writes JSONL to a file by stringifying each line at a time */
export async function writeJsonL(filePath: string, rows: unknown[]) {
  const writeStream = createWriteStream(filePath, { encoding: 'utf8' });

  for (const row of rows) {
    writeStream.write(JSON.stringify(row));
    writeStream.write('\n');
  }

  writeStream.end();

  await new Promise((resolve) => writeStream.on('finish', resolve));
}
