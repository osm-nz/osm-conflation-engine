import { join } from 'node:path';
import {
  type Config,
  type OsmId,
  type TagDiff,
  run,
} from '@osm-conflation-engine/cli';
import type { Point } from 'geojson';

interface Properties {
  id: string;
  unit: string;
  number: string;
  street: string;
  city: string;
  district: string;
}

const config: Config = {
  $schema:
    'https://unpkg.com/@osm-conflation-engine/cli/dist/config.schema.json',
  source_data: {
    type: 'file',
    file: join(import.meta.dirname, 'example-dataset.json'),
  },
  o_data: {
    source: {
      type: 'pbf',
      pbf_url:
        'https://download.geofabrik.de/australia-oceania/new-zealand-latest.osm.pbff',
      pbf_filter: ['addr:housenumber+addr:street,ref:au:address_id'],
    },
    tags_to_keep: ['check_date', '/^addr/'],
  },
  merge: {
    osm_key: 'ref:au:address_id',
    dataset_column: 'id',
  },
  metadata: {
    name: 'Example Import Project',
    description: 'this is just an example',
    git_repository: 'https://github.com/example/example',
    region: 'AU-WA',
    wiki_page: 'https://osm.wiki/Example',
  },
};

await run<Point, Properties>(config, {
  getLocalKeyForOsm(feature) {
    return `${feature.tags['addr:housenumber']} ${feature.tags['addr:street']}`;
  },
  getLocalKeyForSource(item) {
    return item.properties.number + item.properties.street;
  },

  create({ source, osmCandidates }) {
    // search through the candiates to see if one of them is
    // the feature that we're looking for. If yes, we'll reuse
    // that feature instead of creating a new one
    let existingFeature: OsmId | undefined;
    for (const candidate of osmCandidates) {
      if (
        candidate.tags['addr:street']?.toLowerCase() ===
        source.properties.street
      ) {
        existingFeature = candidate.id;
      }
    }

    const tagDiff: TagDiff = {
      'addr:housenumber': source.properties.number,
      'addr:street': source.properties.street,
    };

    return {
      selection: existingFeature,
      group: `Adress Update - ${source.properties.city}`, // optional, to provide more meaningful groups
      diff: { tags: tagDiff },
    };
  },

  mergeOneToOne({ source, osm }) {
    const tagDiff: TagDiff = {};

    // check that both tags are correct:
    if (source.properties.street !== osm.tags['addr:street']) {
      tagDiff['addr:street'] = source.properties.street;
    }

    if (source.properties.street !== osm.tags['addr:housenumber']) {
      tagDiff['addr:housenumber'] = source.properties.number;
    }

    return {
      group: `Adress Update - ${source.properties.city}`,
      diff: { tags: tagDiff },
    };
  },

  deleteFeature({ osm }) {
    // check if there are any non-address tags on this node.
    // - if yes, we should not delete the node, just remove the address tags
    // - if no, we can fully delete the node

    const allTagsAreAddressTags = Object.keys(osm.tags).every(
      (key) => key.startsWith('addr:') || key === config.merge.osm_key,
    );
    if (allTagsAreAddressTags) {
      return { diff: { tags: { __action: 'delete' } } };
    }

    // else, remove tags instead of deleting
    const tagDiff: TagDiff = {
      __action: 'edit',
      'addr:housenumber': '🗑️',
      'addr:street': '🗑️',
    };
    return { diff: { tags: tagDiff } };
  },
});
