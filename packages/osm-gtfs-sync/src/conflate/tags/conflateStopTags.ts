import { type Stop, VehicleType, WheelchairBoardingType } from 'gtfs-types';
import type { Tags } from 'osm-api';
import type { NetworkConfig } from '../../types/config.def';
import { getStopTagsForTransportMode } from '../../helpers/tagging';
import { getOsmRef } from '../../helpers/data';
import { deleteIgnoredTags } from './tagHelpers';

// no point editting a node if it's purely to edit these tags
export const NON_MEANINGFUL_TAGS = new Set([
  'name',
  'official_name',
  'network',
  'network:wikidata',
  'network:wikipedia',
  'operator',
  'operator:wikidata',
  'operator:wikipedia',
  'public_transport',
  'bus',
  // crap that we remove:
  'gtfs:id',
  'gtfs:name',
  'gtfs:stop_id',
]);

export const transformName = (name: string) =>
  name
    .replace(' Train Station', '')
    .replace(' Ferry Terminal', '')
    .replace(/ \(school stop\)/, '') // Metlink
    .replace(/ ?\(hail(2| and )ride\)$/, ''); // BUSIT Waikato and Metlink

/**
 * run on both the OSM and GTFS name before comparison, so that
 * simple things like whitespace doesn't get flagged as different names.
 */
export const normalizeName = (name: string | undefined) =>
  name
    ?.normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .replace(' ', '')
    .trim();

export function conflateStopTags(
  config: NetworkConfig,
  tags: Tags,
  gtfsModeOfTransports: Set<VehicleType>,
  gtfsItem: Stop,
  gtfsStopCode: string,
  warnings: Set<string>,
) {
  const tagChanges: Tags = {};

  // 0. check the ref tag. Pointless, but included for consistency
  const { key: refKey, value: ref } = getOsmRef('stop', config, tags);
  if (ref !== gtfsStopCode) tagChanges[refKey] = gtfsStopCode;

  // 1. ensure base tags are defined
  const baseTags: Tags = {};
  for (const modeOfTransport of gtfsModeOfTransports) {
    Object.assign(
      baseTags,
      getStopTagsForTransportMode(modeOfTransport, warnings),
    );
  }
  for (const [key, value] of Object.entries(baseTags)) {
    if (tags[key] !== value) {
      // don't try to add highway=bus_stop if it's mising
      // but if we're creating a brand new feature, then do add highway=bus_stop
      if (key === 'highway' && !!Object.keys(tags).length) continue;

      tagChanges[key] = value;
    }
  }

  // 1a. special case for school_bus-only stops
  if (
    gtfsModeOfTransports.size === 1 &&
    gtfsModeOfTransports.has(VehicleType.SCHOOL_BUS)
  ) {
    if (tags.access !== 'no') tagChanges.access = 'no';
    if (tags.school_bus !== 'designated') tagChanges.school_bus = 'designated';
  } else {
    // if this stop is not school_bus-only, then remove any school_bus tags.
    if (tags.school_bus === 'designated') {
      tagChanges.access = '🗑️';
      tagChanges.school_bus = '🗑️';
    }
  }

  // 2. add NSI tags for network
  if (!tags.network?.split(';').includes(config.networkName)) {
    tagChanges.network = tags.network
      ? `${tags.network};${config.networkName}`
      : config.networkName;
  }
  if (
    config.networkWikidata &&
    !tags['network:wikidata']?.split(';').includes(config.networkWikidata)
  ) {
    tagChanges['network:wikidata'] = tags['network:wikidata']
      ? `${tags['network:wikidata']};${config.networkWikidata}`
      : config.networkWikidata;
  }

  // 3. delete spammy NSI tags
  if (tags['network:wikipedia']) tagChanges['network:wikipedia'] = '🗑️';
  if (tags['operator:wikipedia']) tagChanges['operator:wikipedia'] = '🗑️';
  if (tags['brand:wikipedia']) tagChanges['brand:wikipedia'] = '🗑️';

  // 4. delete redundant operator tags that duplicate the network tag
  if (tags.operator === config.networkName!) tagChanges.operator = '🗑️';
  if (
    config.networkWikidata &&
    tags['operator:wikidata'] === config.networkWikidata
  ) {
    tagChanges['operator:wikidata'] = '🗑️';
  }

  // 5. sync name/official_name
  const gtfsName = transformName(gtfsItem.stop_name!);

  if (!tags.name) {
    // no name, so add it
    tagChanges.name = gtfsName;
  } else if (
    config.overrideExistingNames &&
    normalizeName(tags.name) !== normalizeName(gtfsName)
  ) {
    // optional mode:
    // we forcefully override the name tag
    tagChanges.name = gtfsName;
    if (tags.official_name) tagChanges.official_name = '🗑️';
  } else if (
    normalizeName(tags.name) !== normalizeName(gtfsName) &&
    normalizeName(tags.official_name) !== normalizeName(gtfsName)
  ) {
    // default mode:
    // respect existing names, so add the GTFS name to the official_name tag
    tagChanges.official_name = gtfsName;
  }

  // 6. sync local_ref. We also accept loc_ref, but not both
  if (
    gtfsItem.platform_code &&
    (tags.local_ref || tags.loc_ref) !== gtfsItem.platform_code
  ) {
    tagChanges.local_ref = gtfsItem.platform_code;
  }
  if (tags.loc_ref && tags.local_ref) tagChanges.loc_ref = '🗑️';

  // 7. delete tags that duplicate each other
  const finalishTags = { ...tags, ...tagChanges };
  if (finalishTags.ref && finalishTags.ref === finalishTags.local_ref) {
    tagChanges.local_ref = '🗑️';
  }
  if (finalishTags.ref && finalishTags.ref === finalishTags.name) {
    tagChanges.name = gtfsName;
    if (finalishTags.official_name) tagChanges.official_name = '🗑️';
  }
  if (finalishTags.name && finalishTags.name === finalishTags.official_name) {
    tagChanges.official_name = '🗑️';
  }

  // 8. delete spammy tags from previous imports
  //    gtfs:* is useless, but gtfs:*:* is okay,
  //    since it's feed-specific information.
  for (const key in tags) {
    if (key.startsWith('gtfs:') && key.split(':').length <= 2) {
      tagChanges[key] = '🗑️';
    }
  }

  // 9. sync wheelchair=*
  if (
    gtfsItem.wheelchair_boarding === WheelchairBoardingType.ACCESSIBLE &&
    tags.wheelchair !== 'yes'
  ) {
    tagChanges.wheelchair = 'yes';
  }
  if (
    gtfsItem.wheelchair_boarding === WheelchairBoardingType.NOT_ACCESSIBLE &&
    tags.wheelchair !== 'no'
  ) {
    tagChanges.wheelchair = 'no';
  }

  deleteIgnoredTags(config, tagChanges);
  return tagChanges;
}
