import type { Tags } from 'osm-api';
import type { Tags as NullishTags } from 'pbf2json';
import { CHECK_DATE_KEY } from '../../../constants/defaults.js';
import type { Ctx } from '../../../types/internal.def.js';

export function validateOsmTagsInConfig(ctx: Ctx) {
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

  function pickTags(allTags: NullishTags | undefined) {
    const tags: Tags = {};
    if (allTags) {
      for (const key in allTags) {
        const value = allTags[key];
        if (keepKey(key) && value) {
          tags[key] = value;
        }
      }
    }
    return tags;
  }

  return { pickTags };
}
