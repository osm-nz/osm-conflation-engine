import { VehicleType } from "gtfs-types";
import type { Config } from "../../../types";
import type { StopsStationsOutput } from "../../readStopsFromGtfs";
import { getStopTagsForTransportMode } from "../../../constants";

export const transformName = (name: string) =>
  name.replace(" Train Station", "").replace(" Ferry Terminal", "");

/**
 * run on both the OSM and GTFS name before comparison, so that
 * simple things like whitespace doesn't get flagged as different names.
 */
export const normalizeName = (name: string | undefined) =>
  name
    ?.normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(" ", "")
    .trim();

export function conflateStopTags(
  config: Config,
  tags: Record<string, string>,
  gtfsModeOfTransport: VehicleType,
  gtfsItem: StopsStationsOutput["stops"][string],
  gtfsStopCode: string
) {
  const tagChanges: Record<string, string> = {};

  // 0. check the ref tag. Pointless, but included for consistency
  if (tags.ref !== gtfsStopCode) tagChanges.ref = gtfsStopCode;

  // 1. ensure base tags are defined
  const baseTags = getStopTagsForTransportMode(gtfsModeOfTransport);
  for (const [key, value] of Object.entries(baseTags)) {
    if (tags[key] !== value && key !== "highway") {
      // don't try to add highway=bus_stop if it's mising
      tagChanges[key] = value;
    }
  }

  // 2. add NSI tags for network
  if (tags.network !== config.networkName!) {
    tagChanges.network = config.networkName!;
  }
  if (
    config.networkWikidata &&
    tags["network:wikidata"] !== config.networkWikidata!
  ) {
    tagChanges["network:wikidata"] = config.networkWikidata;
  }

  // 3. delete spammy NSI tags
  if (tags["network:wikipedia"]) tagChanges["network:wikipedia"] = "🗑️";
  if (tags["operator:wikipedia"]) tagChanges["operator:wikipedia"] = "🗑️";
  if (tags["brand:wikipedia"]) tagChanges["brand:wikipedia"] = "🗑️";

  // 4. delete redundant operator tags that duplicate the network tag
  if (tags.operator === config.networkName!) tagChanges.operator = "🗑️";
  if (
    config.networkWikidata &&
    tags["operator:wikidata"] === config.networkWikidata
  ) {
    tagChanges["operator:wikidata"] = "🗑️";
  }

  // 5. sync name/official_name
  const gtfsName = transformName(gtfsItem.name);
  if (!tags.name) {
    tagChanges.name = gtfsName;
  } else if (
    normalizeName(tags.name) !== normalizeName(gtfsName) &&
    normalizeName(tags.official_name) !== normalizeName(gtfsName)
  ) {
    // respect existing names, so add the GTFS name to the official_name tag
    tagChanges.official_name = gtfsName;
  }

  // 6. sync loc_ref. We also accept local_ref, but not both
  if (gtfsItem.locRef && (tags.loc_ref || tags.local_ref) !== gtfsItem.locRef) {
    tagChanges.loc_ref = gtfsItem.locRef;
  }
  if (tags.loc_ref && tags.local_ref) tagChanges.local_ref = "🗑️";

  return tagChanges;
}
