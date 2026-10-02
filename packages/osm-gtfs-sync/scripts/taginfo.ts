import { promises as fs } from 'node:fs';
import { basename, join } from 'node:path';
import type { DateString, Schema, Tag } from 'taginfo-projects';
// import nsi from 'name-suggestion-index/dist/wikidata/wikidata.json' with { type: 'json' };
import type { NsiWikidataJSON } from 'name-suggestion-index';
import _file from '../taginfo.template.json' with { type: 'json' };
import { CONFIG } from '../src/config/_index.ts';

const nsi: NsiWikidataJSON = JSON.parse(
  await fs.readFile(
    new URL(
      '../wikidata/wikidata.json', // it resolves to ./lib
      import.meta.resolve('name-suggestion-index'),
    ),
    'utf8',
  ),
);

// importing from a JSON file doesn't work well
const file = _file as Schema;

//
// this file takes the taginfo template file, and adds the tags
// that are specific to each region.
//

const BASE_URL = file.project.doc_url!;

for (const region of CONFIG) {
  const nsiEntry = nsi.wikidata[region.networkWikidata];

  const countryName = new Intl.DisplayNames(undefined, { type: 'region' }).of(
    region.region.split('-', 1)[0],
  );

  const basic = {
    description: `Used for conflating GTFS data with OSM, for ‘${region.networkName}’ (${countryName})`,
    icon_url: Object.values(nsiEntry?.logos || {})[0],
    object_types: ['node', 'relation'],
    doc_url: `${BASE_URL}#/project/::gtfs::${region.code}`,
  } satisfies Partial<Tag>;

  file.tags.push(
    { ...basic, key: 'network', value: region.networkName },
    { ...basic, key: 'network:wikidata', value: region.networkWikidata },
  );
  const gtfsKeyPrefixes = [
    'gtfs:stop_id:',
    'gtfs:stop_code:',
    'gtfs:route_id:',
    'gtfs:route_short_name:',
  ];
  for (const keyPrefix of gtfsKeyPrefixes) {
    file.tags.push({
      ...basic,
      object_types: keyPrefix.includes('route') ? ['relation'] : ['node'],
      description: `Used as a BACKUP OPTION ONLY, the ref=* tag is strongly preferred. This tag should only be used as a last-resort solution if multiple networks use the same stop, and ‘${region.networkName}’ (${countryName}) uses a different ref=* to the other networks.`,
      key: keyPrefix + region.code,
      value: region.networkWikidata,
    });
  }
}

file.data_updated = new Date()
  .toISOString()
  .replaceAll(/([-:]|\.\d+)/g, '') as DateString;

await fs.writeFile(
  join(import.meta.dirname, `../../website/public/${basename(file.data_url!)}`),
  JSON.stringify(file, null, 2),
);
