import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { OsmPatch } from 'osm-api';
import type { Ctx, HandlerReturnWithBBox } from '../../types/index.js';
import { IS_UNIT_TEST } from '../../constants/defaults.js';
import { sha256 as hash } from '../../helpers.js';
import { calcCount } from '../../common/calcCount.js';

function toId(suburb: string) {
  // macrons are url safe
  return `${suburb.replaceAll(/[^\dA-Za-zĀāĒēĪīŌōŪū]/g, '')}_${hash(suburb).slice(0, 6)}`;
}

export async function createIndexAndSaveToDisk(
  ctx: Ctx,
  suburbs: HandlerReturnWithBBox,
): Promise<void> {
  const githubParts = ctx.config.metadata.git_repository.match(
    'https://github.com/([^/]+)/([^/]+)',
  );
  if (!githubParts) throw new Error('git_repository is not a valid github url');
  const outputFolder =
    ctx.config.output?.folder || join(process.cwd(), 'output');
  const subFolderName = 'suburbs';

  const meta = Object.entries(suburbs).map(([suburb, v]) => ({
    suburb,
    bbox: v.bbox,
    instructions: v.instructions,
    ...calcCount(v.features),
  }));

  // create index.json
  const indexFile = {
    fields: [],
    results: meta
      .map((v) => {
        const title = v.suburb.replace('ZZ ', '').replace('Z ', '');
        return {
          id: toId(v.suburb),
          url: `https://${githubParts[1]}.github.io/${githubParts[2]}/${subFolderName}/${toId(v.suburb)}.osmPatch.geo.json`,
          name: title,
          title,
          totalCount: v.totalCount,
          source: '',
          snippet: v.count,
          extent: [
            [v.bbox.minLng, v.bbox.minLat],
            [v.bbox.maxLng, v.bbox.maxLat],
          ],
          instructions: v.instructions,
          groupCategories: [
            v.suburb.startsWith('ZZ')
              ? '/Categories/Preview'
              : '/Categories/Addresses',
          ],
        };
      })
      .toSorted((a, b) => a.name.localeCompare(b.name)),
  };
  await fs.mkdir(join(outputFolder, subFolderName), { recursive: true });
  await fs.writeFile(
    join(outputFolder, 'index.json'),
    JSON.stringify(indexFile, null, IS_UNIT_TEST ? 2 : undefined),
  );

  // save each suburb
  for (const s of meta) {
    const { suburb } = s;
    const geojson: OsmPatch = {
      type: 'FeatureCollection',
      ...suburbs[suburb]!,
    };
    geojson.changesetTags ||= {
      attribution: 'https://wiki.openstreetmap.org/wiki/Contributors#LINZ',
      created_by: 'LINZ Data Import 2.0.0',
      locale: 'en-NZ',
      source: 'https://wiki.osm.org/LINZ',
      comment: suburb,
    };

    await fs.writeFile(
      join(outputFolder, subFolderName, `${toId(suburb)}.osmPatch.geo.json`),
      JSON.stringify(geojson, null, IS_UNIT_TEST ? 2 : undefined),
    );
  }
}
