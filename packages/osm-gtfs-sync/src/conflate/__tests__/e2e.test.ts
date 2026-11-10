import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { importDBFromZip } from 'gtfs-sqlite';
import type { GtfsFile } from 'gtfs-types';
import { type ConflationResult, conflate } from '../index.ts';
import type { NetworkConfig } from '../../types/config.def.ts';
import { writeToRunHistory } from '../../api/conflation.ts';

vi.mock('gtfs-sqlite', () => vi.importActual('gtfs-sqlite/e2e'));
vi.mock('../../api/conflation.ts', () => ({ writeToRunHistory: vi.fn() }));
vi.mock('../../api/osm.ts', () => ({
  fetchOsmData: vi.fn(async (source: string) => ({
    source,
    query: '/* mock query */',
    date: new Date().toISOString(),
    osmData: JSON.parse(
      await fs.readFile(join(import.meta.dirname, 'mock/osm.json'), 'utf8'),
    ),
  })),
}));

const config: NetworkConfig = {
  code: 'EG-EX',
  gtfsSource: {
    mode: 'automatic',
    url: 'https://example.com/gtfs.zip',
  },
  licenseWaiverUrl: '',
  networkName: 'Autobüs',
  networkWikidata: 'Q12345',
  region: 'EG',
};

describe(conflate, () => {
  it('works for a full example feed', async () => {
    const folder = join(import.meta.dirname, 'mock/gtfs');
    const fileNames = (await fs.readdir(folder)) as GtfsFile[];
    const files: importDBFromZip.IndividualFiles = {};
    for (const fileName of fileNames) {
      files[fileName] = new Blob([await fs.readFile(join(folder, fileName))]);
    }
    await importDBFromZip({ databaseName: 'EG-EX', zipFile: files });

    const onProgress = vi.fn<(result: ConflationResult) => void>();
    await conflate(
      config,
      onProgress,
      new AbortController().signal,
      'overpass',
      true,
    );

    expect(onProgress.mock.calls.map(([r]) => r.message)).toStrictEqual([
      'connecting to sqlite database in the WebWorker…',
      'Calculating Bbox from GTFS stops...',
      'Fetching OSM data from overpass...',
      'conflating stops...',
      'conflating stations...',
      'conflating routes...',
      'saving progress update...',
      'done!',
    ]);

    const { stops, stations, routes, ...rest } = onProgress.mock.lastCall![0];
    expect(rest).toMatchSnapshot('summary');
    expect(stops).toMatchSnapshot('stops');
    expect(stations).toMatchSnapshot('stations');
    expect(routes).toMatchSnapshot('routes');

    expect(writeToRunHistory).toHaveBeenCalledExactlyOnceWith(
      'EG-EX',
      expect.anything(),
    );
    expect(vi.mocked(writeToRunHistory).mock.calls[0][1]).toMatchSnapshot(
      'metrics',
    );
  });
});
