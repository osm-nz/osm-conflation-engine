import type { OsmFeature } from 'osm-api';
import type { DatasetId } from '@osm-conflation-engine/cli';
import type { CSWithDiff } from './patchOsmChange.js';
import type {
  ChangesetWatchConfig,
  IgnoreList as IgnoredAddr,
} from './types.def.js';

export function checkDiffsForAddress(
  config: ChangesetWatchConfig,
  list: CSWithDiff[],
): IgnoredAddr[] {
  const out: IgnoredAddr[] = [];
  for (const { cs, diff } of list) {
    const remove = diff.delete.filter((f) => f.tags?.[config.refTag]);

    const deletedAddresses: Record<DatasetId, OsmFeature> = {};

    /** e.g. { '12 Example St': '[LINZ ref]' } */
    const seenAddresses: Record<string, DatasetId> = {};

    // add all deleted features to the list first
    for (const feat of remove) {
      const addrId = <DatasetId>feat.tags![config.refTag];
      deletedAddresses[addrId] = feat;

      seenAddresses[config.getLocalKey(feat)] = addrId;
    }

    // then remove all addrIds that were added back to a different feature
    for (const feat of [...diff.modify, ...diff.create]) {
      const addrId = <DatasetId>feat.tags![config.refTag];
      if (addrId) {
        delete deletedAddresses[addrId];
      } else {
        // This is an address the user created or updated, which doesn't have a ref:... tag.
        // So we check if this is this new address is identical to one that was deleted.
        // if so, we won't add this address to the ignore-list.
        const maybeLinzAddr = seenAddresses[config.getLocalKey(feat)];
        if (maybeLinzAddr) delete deletedAddresses[maybeLinzAddr];
      }
    }

    const issues = Object.entries(deletedAddresses)
      .filter(([, osmFeature]) => osmFeature.tags![config.refTag])
      .map(([addrId, osmFeature]): IgnoredAddr => {
        return {
          refTag: config.refTag,
          rowId: <DatasetId>addrId,
          changeset: cs.id,
          local_key: config.getLocalKey(osmFeature),
          label: config.getLabel?.(osmFeature) || '',
          username: cs.user,
          timestamp: cs.closed_at!,
          // eslint-disable-next-line dot-notation
          note: `(${cs.tags['created_by']?.split(' ', 1)[0]}): ${cs.tags['comment']}`,

          // these are just to keep the type defintions happy, they're
          // actually ignored and defined by the server:
          reviews: null,
          review_decision: null,
          operator: '',
        };
      });
    out.push(...issues);
  }
  return out;
}
