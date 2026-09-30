import type { Stop } from 'gtfs-types';
import type { Tags } from 'osm-api';
import { getOsmRef, getStopCode } from '../../helpers/data.js';
import type { NetworkConfig } from '../../types/config.def.js';
import { normalizeName, transformName } from './conflateStopTags.js';
import { deleteIgnoredTags } from './tagHelpers.js';

const transformStationName = (name: string) =>
  name
    .replaceAll(/(\w)\/(\w)/g, '$1 / $2') // space between slashes
    .replace(/(^\/|\/$)/, ''); // leading or trailing slashes

export function conflateStationTags(
  config: NetworkConfig,
  tags: Tags,
  gtfsItem: Stop,
) {
  const tagChanges: Tags = {};

  const gtfsStopCode = getStopCode(gtfsItem, config);

  // 0. check the ref tag
  const { key: refKey, value: ref } = getOsmRef('stop', config, tags);
  if (ref !== gtfsStopCode) tagChanges[refKey] = gtfsStopCode;

  // 1. ensure base tags are defined
  if (tags.type !== 'public_transport') tagChanges.type = 'public_transport';
  if (tags.public_transport !== 'stop_area') {
    tagChanges.public_transport = 'stop_area';
  }

  // 2. sync name/official_name
  const gtfsName = transformStationName(transformName(gtfsItem.stop_name!));
  if (!tags.name) {
    tagChanges.name = gtfsName;
  } else if (
    normalizeName(tags.name) !== normalizeName(gtfsName) &&
    normalizeName(tags.official_name) !== normalizeName(gtfsName)
  ) {
    // respect existing names, so add the GTFS name to the official_name tag
    tagChanges.official_name = gtfsName;
  }

  deleteIgnoredTags(config, tagChanges);
  return tagChanges;
}
