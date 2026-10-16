import { execFileSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { config, main } from '../main.js';

describe('end-to-end test', () => {
  // convert the mock.xml file into mock.pbf
  beforeAll(() => {
    const std = execFileSync('osmium', [
      'cat',
      join(import.meta.dirname, 'mock/planet.xml'),
      '-o',
      join(import.meta.dirname, 'mock/planet.pbf'),
      '--overwrite',
    ]);
    process.stdout.write(std);
  });

  it('works', async () => {
    const outFolder = config.output!.folder!;
    await fs.rm(outFolder, { recursive: true, force: true });
    await fs.mkdir(outFolder);

    const start = Date.now();
    await main();
    const duration = (Date.now() - start) / 1000 / 60;

    expect(duration).toBeLessThan(1); // seconds. something is clearly broken if it takes longer

    // this file contains unstable stuff, like absolute paths on disk.
    // so we need to delete that from the snapshot tests.
    const metricsPath = join(import.meta.dirname, 'snapshot/metrics.json');
    const metrics = await JSON.parse(await fs.readFile(metricsPath, 'utf8'));
    metrics.config = null;
    await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));

    // need to wait for git to re-calculate the diff
    await setTimeout(1000);

    const anyUncommitedChanges = !!execFileSync('git', [
      'status',
      '--porcelain',
    ])
      .toString()
      .replace('\n', '');

    if (anyUncommitedChanges) {
      throw new Error('Tests failed because some files were modified');
    }
  }, 10_000);
});
