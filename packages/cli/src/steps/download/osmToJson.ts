import { existsSync } from 'node:fs';
import pbf2json, { type Item } from 'pbf2json';
import type { OsmFeature as StandardOsmFeature } from 'osm-api';
import {
  type Ctx,
  type OSMData,
  type OsmFeature,
  type OsmFeatureTypeShort,
  OsmFlags,
} from '../../types/index.js';
import { validateOsmTagsInConfig } from './util/validateOsmTagsInConfig.js';
import {
  loadOsmFeature,
  saveLoadedOsmFeatures,
} from './util/loadOsmFeature.js';

export type PbfMetadata = Partial<
  Pick<StandardOsmFeature, 'changeset' | 'version' | 'user'> & {
    timestamp: number; // unlike the API, the golang code returns a number
  }
>;

export async function osmToJson(ctx: Ctx, pbfFilter: string[]) {
  if (ctx.use_cache && existsSync(ctx.tempFileNames.osm_processed_other)) {
    console.info('Using cached osm data');
    return;
  }

  const { pickTags } = validateOsmTagsInConfig(ctx);

  console.info('Starting preprocess of OSM data...');
  const result = await new Promise<OSMData>((resolve, reject) => {
    const out: OSMData = {
      withRef: {},
      noRef: {},
      duplicateRefs: {},
      semi: {},
      count: 0,
    };

    let anyMetadata = false;

    let anythingSeen = false;
    pbf2json
      .createReadStream({
        file: ctx.tempFileNames.pbf,
        tags: pbfFilter,
        leveldb: '/tmp',
        // @ts-expect-error -- missing from typedefs since we
        //                     added this option in our fork.
        metadata: true,
      })
      .on(
        'data',
        //
        (item: Item) => {
          anythingSeen ||= true;
          const coords = item.type === 'node' ? item : item.centroid;
          // @ts-expect-error -- missing from typedefs since we
          //                     added this option in our fork.
          const metadata: PbfMetadata | undefined = item.meta;
          if (metadata) anyMetadata = true;

          const tags = pickTags(item.tags);

          const object: OsmFeature = {
            id: `${<OsmFeatureTypeShort>item.type[0]}${item.id}`,
            centroid: [coords.lon, coords.lat],
            metadata: metadata
              ? {
                  changeset: metadata.changeset,
                  timestamp: metadata.timestamp
                    ? new Date(1e3 * metadata.timestamp).toISOString()
                    : undefined,
                  user: metadata.user,
                  version: metadata.version,
                }
              : undefined,
            tags,

            // added later
            sectors: [],
            flags: OsmFlags.None,
          };
          loadOsmFeature(ctx, out, object);

          if (!(out.count % 1000)) process.stdout.write('.');
        },
      )
      .on('finish', () => {
        if (!anyMetadata) {
          ctx.warnings.push('No metadata extracted from the planet file!');
        }
        if (!anythingSeen) {
          throw new Error(
            'Nothing extracted from the pbf file, presumably it’s invalid.',
          );
        }
        resolve(out);
      })
      .on('error', reject);
  });

  await saveLoadedOsmFeatures(ctx, result);
}
