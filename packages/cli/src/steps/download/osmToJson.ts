import { existsSync, promises as fs } from 'node:fs';
import pbf2json, { type Item } from 'pbf2json';
import type { OsmFeature as StandardOsmFeature, Tags } from 'osm-api';

import { CHECK_DATE_KEY, RECENT_THRESHOLD } from '../../constants/defaults.js';
import {
  CheckDate,
  type Ctx,
  type DatasetId,
  type OSMData,
  type OsmFeature,
  type OsmFeatureTypeShort,
  OsmFlags,
} from '../../types/index.js';
import { isChecked } from '../../common/helpers.js';
import { getSector } from '../../common/getSector.js';
import { writeJsonL } from '../../common/jsonl.js';

const THRESHOLD_DATE = ((d) => {
  d.setDate(d.getDate() - RECENT_THRESHOLD);
  return +d / 1000;
})(new Date());

type PbfMetadata = Partial<
  Pick<StandardOsmFeature, 'changeset' | 'version' | 'user'> & {
    timestamp: number; // unlike the API, the golang code returns a number
  }
>;

export async function osmToJson(ctx: Ctx, pbfFilter: string[]) {
  if (ctx.use_cache && existsSync(ctx.tempFileNames.osm_processed_other)) {
    console.info('Using cached osm data');
    return;
  }

  console.info('Starting preprocess of OSM data...');
  const result = await new Promise<OSMData>((resolve, reject) => {
    const out: OSMData = {
      withRef: {},
      noRef: {},
      duplicateRefs: {},
      semi: {},
      count: 0,
    };
    let index = 0;

    let anyMetadata = false;

    const checkDateKey = ctx.config.o_data.check_date_key || CHECK_DATE_KEY;

    const requiredKeys = new Set([
      // sanity check that the internal keys are included.
      checkDateKey,
      ctx.config.merge.osm_key,
    ]);
    const missingKeys = requiredKeys.difference(
      new Set(ctx.config.o_data.tags_to_keep),
    );
    if (missingKeys.size) {
      throw new Error(
        `config.o_data.tags_to_keep is missing some tags that are referenced in other parts of the config: ${[...missingKeys].join(', ')}`,
      );
    }

    /** re-constructing regexes is expensive, so use a reference instead */
    const regExs: RegExp[] = [];
    for (const keyOrRegEx of ctx.config.o_data.tags_to_keep) {
      if (keyOrRegEx.startsWith('/') && keyOrRegEx.endsWith('/')) {
        regExs.push(new RegExp(keyOrRegEx.slice(1, -1)));
      }
    }

    /** cache every seen key, to avoid wasting time with regexes */
    const tagsToKeep: Record<string, boolean> = {};
    function keepKey(key: string) {
      if (key in tagsToKeep) return tagsToKeep[key];

      let keep = ctx.config.o_data.tags_to_keep.includes(key);

      if (!keep) {
        for (const regex of regExs) {
          if (regex.test(key)) {
            keep = true;
            break;
          }
        }
      }

      tagsToKeep[key] = keep;
      return keep;
    }

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
          const coords = item.type === 'node' ? item : item.centroid;
          // @ts-expect-error -- missing from typedefs since we
          //                     added this option in our fork.
          const metadata: PbfMetadata | undefined = item.meta;
          if (metadata) anyMetadata = true;

          const tags: Tags = {};
          for (const key in item.tags) {
            const value = item.tags[key];
            if (keepKey(key) && value) {
              tags[key] = value;
            }
          }

          const object: OsmFeature = {
            id: `${<OsmFeatureTypeShort>item.type[0]}${item.id}`,
            centroid: [coords.lon, coords.lat],
            sectors: getSector(
              { type: 'Point', coordinates: [coords.lon, coords.lat] },
              ctx.config.merge.sector_resolution,
            ),
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
            flags: OsmFlags.None,
          };

          // boolean flags
          if ((metadata?.timestamp ?? 0) > THRESHOLD_DATE) {
            object.flags |= OsmFlags.IsRecentlyChanged;
          }

          const isLastEditedByImporter =
            metadata?.user &&
            // TODO: cache the result per username
            (ctx.callbacks.isImportUser
              ? ctx.callbacks.isImportUser?.(metadata?.user)
              : metadata?.user?.endsWith('_import'));
          if (metadata?.version === 1 || isLastEditedByImporter) {
            object.flags |= OsmFlags.IsLastEditedByImporter;
          }

          if (tags[checkDateKey]) {
            object.flags |= OsmFlags.IsChecked;
          }

          if (isChecked(tags[checkDateKey]) === CheckDate.YesRecent) {
            object.flags |= OsmFlags.IsCheckedRecently;
          }

          const primaryKey = <DatasetId | undefined>(
            item.tags[ctx.config.merge.osm_key]
          );
          if (primaryKey) {
            out.count++;
            // check if there is already an OSM object with the same linz ID

            // this node is 3rd+ one with this linzId
            if (out.duplicateRefs[primaryKey]) {
              out.duplicateRefs[primaryKey].push(object);
            }

            // this node is 2nd one with this linzId
            else if (out.withRef[primaryKey]) {
              out.duplicateRefs[primaryKey] = [out.withRef[primaryKey], object];
              delete out.withRef[primaryKey];
            }

            // the linz id has a semicolon in it - we don't like this
            // unless the address has alt_addr:* tags.
            else if (primaryKey.includes(';')) {
              const mergedIds = <DatasetId[]>primaryKey.split(';');
              for (const value of mergedIds) {
                out.semi[value] = object;
              }
            }

            // not a duplicate
            else {
              out.withRef[primaryKey] = object;
            }
          } else {
            out.noRef[object.id] = object;
          }

          index += 1;
          if (!(index % 1000)) process.stdout.write('.');
        },
      )
      .on('finish', () => {
        if (!anyMetadata) {
          ctx.warnings.push('No metadata extracted from the planet file!');
        }
        resolve(out);
      })
      .on('error', reject);
  });

  const { withRef, noRef, ...other } = result;

  await writeJsonL(
    ctx.tempFileNames.osm_processed_with_ref,
    Object.values(withRef),
  );
  await writeJsonL(
    ctx.tempFileNames.osm_processed_no_ref,
    Object.values(noRef),
  );
  await fs.writeFile(
    ctx.tempFileNames.osm_processed_other,
    JSON.stringify(other),
  );
}
