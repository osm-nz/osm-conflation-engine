import type { Tags } from 'osm-api';
import type { NetworkConfig } from '../../types/config.def.js';

/**
 * removes any tags from the diff that are listed
 * in {@link NetworkConfig.ignoreTags}.
 */
export function deleteIgnoredTags(config: NetworkConfig, tagDiff: Tags) {
  for (const key of config.ignoreTags || []) {
    if (key.endsWith('[:*]')) {
      const base = key.replace('[:*]', '');
      delete tagDiff[base];
      delete tagDiff[`${base}:wikidata`];
    } else {
      delete tagDiff[key];
    }
  }
}
