import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { OsmPatch } from 'osm-api';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type {
  ConflateResult,
  Ctx,
  IndexFileProperties,
  OutputLayers,
} from '../../types/index.js';
import { IS_UNIT_TEST } from '../../constants/defaults.js';
import { sha256 as hash } from '../../helpers.js';
import { calcCount } from '../../common/calcCount.js';
import { bboxToPolygon } from '../../common/bboxToPolygon.js';

function toId(suburb: string) {
  // macrons are url safe
  return `${suburb.replaceAll(/[^\dA-Za-zĀāĒēĪīŌōŪū]/g, '').slice(0, 100)}_${hash(suburb).slice(0, 6)}`;
}

export async function createIndexAndSaveToDisk(
  ctx: Ctx,
  metrics: ConflateResult,
  suburbs: OutputLayers,
): Promise<void> {
  const githubParts = ctx.config.metadata.git_repository.match(
    'https://github.com/([^/]+)/([^/]+)',
  );
  if (!githubParts) throw new Error('git_repository is not a valid github url');
  const outputFolder =
    ctx.config.output?.folder || join(process.cwd(), 'output');
  const subFolderName = 'suburbs';

  const meta = Object.entries(suburbs).flatMap(([category, groups]) =>
    Object.entries(groups).map(([group, items]) => ({
      category,
      group,
      title: [category, group].filter(Boolean).join(' - '),
      bbox: items.bbox,
      instructions: items.instructions,
      ...calcCount(items.features),
    })),
  );

  // create index.json
  const indexFile = {
    fields: [],
    results: meta
      .map((v) => {
        return {
          id: toId(v.title),
          url: `https://${githubParts[1]}.github.io/${githubParts[2]}/${subFolderName}/${toId(v.title)}.osmPatch.geo.json`,
          name: v.title,
          title: v.title,
          totalCount: v.totalCount,
          source: '',
          snippet: v.count,
          extent: [
            [v.bbox.minLng, v.bbox.minLat],
            [v.bbox.maxLng, v.bbox.maxLat],
          ],
          instructions: v.instructions,
          groupCategories: [v.category, '/Categories/Addresses'],
        };
      })
      .toSorted((a, b) => a.name.localeCompare(b.name)),
  };

  // create index.geo.json
  const newIndexFile: FeatureCollection<Polygon, IndexFileProperties> = {
    type: 'FeatureCollection',
    features: meta
      .map(({ bbox, ...other }): Feature<Polygon, IndexFileProperties> => {
        return {
          type: 'Feature',
          geometry: bboxToPolygon(bbox),
          properties: other,
        };
      })
      .toSorted((a, b) => a.properties.title.localeCompare(b.properties.title)),
  };

  await fs.mkdir(join(outputFolder, subFolderName), { recursive: true });
  await fs.writeFile(
    join(outputFolder, 'index.json'),
    JSON.stringify(indexFile, null, IS_UNIT_TEST ? 2 : undefined),
  );
  await fs.writeFile(
    join(outputFolder, 'index.geo.json'),
    JSON.stringify(newIndexFile, null, IS_UNIT_TEST ? 2 : undefined),
  );
  await fs.writeFile(
    join(outputFolder, 'metrics.json'),
    JSON.stringify(metrics, null, 2),
  );

  // save each suburb
  for (const v of meta) {
    const geojson: OsmPatch = {
      type: 'FeatureCollection',
      ...suburbs[v.category]![v.group]!,
    };

    await fs.writeFile(
      join(outputFolder, subFolderName, `${toId(v.title)}.osmPatch.geo.json`),
      JSON.stringify(geojson, null, IS_UNIT_TEST ? 2 : undefined),
    );
  }
}
