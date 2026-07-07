import { createReadStream, promises as fs } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { geoCentroid } from 'd3-geo';
import type { Feature, GeoJsonProperties, Geometry } from 'geojson';
import type { Ctx, OSMData, SourceData, Vec2 } from '../../types/index.js';
import { getSector } from '../../common/getSector.js';
import { readJsonL } from '../../common/jsonl.js';

export async function readData<
  G extends Geometry = Geometry,
  P extends GeoJsonProperties = GeoJsonProperties,
>(ctx: Ctx) {
  console.info('Reading source data into memory...');
  let count = 0;
  const sourceData: SourceData<G, P> = {};
  const readline = createInterface({
    input: createReadStream(ctx.config.source_data.file),
    crlfDelay: Infinity,
  });
  for await (const line of readline) {
    const feature: Feature<G, P> = JSON.parse(line);
    const id = feature.properties![ctx.config.merge.dataset_column];
    sourceData[id] = Object.assign(feature, {
      sectors: getSector(feature.geometry, ctx.config.merge.sector_resolution),
      centroid:
        feature.geometry.type === 'Point'
          ? <Vec2>feature.geometry.coordinates
          : geoCentroid(feature.geometry),
    });
    count++;
  }
  console.info(`\tread ${count} rows.`);

  console.info('Reading osm data into memory (withRef)...');
  const withRef: OSMData['withRef'] = await readJsonL(
    ctx.tempFileNames.osm_processed_with_ref,
    (row) => row.tags[ctx.config.merge.osm_key]!,
  );
  console.info('Reading osm data into memory (noRef)...');
  const noRef: OSMData['noRef'] = await readJsonL(
    ctx.tempFileNames.osm_processed_with_ref,
    (row) => row.id,
  );
  console.info('Reading osm data into memory (other)...');
  const other: Omit<OSMData, 'noRef' | 'withRef'> = JSON.parse(
    await fs.readFile(ctx.tempFileNames.osm_processed_other, 'utf8'),
  );
  const osmData: OSMData = { withRef, noRef, ...other };
  console.info('\tread data.');

  return { sourceData, osmData };
}
