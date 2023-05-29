import { VehicleType } from "gtfs-types";
import type { Config } from "../../../types";
import type { StopsStationsOutput } from "../../readStopsFromGtfs";
import { getStopTagsForTransportMode } from "../../../constants";

// no point editting a node if it's purely to edit these tags
export const NON_MEANINGFUL_TAGS = new Set([
  "network",
  "network:wikidata",
  "network:wikipedia",
  "operator",
  "operator:wikidata",
  "operator:wikipedia",
  "public_transport",
  "bus",
]);

export const transformName = (name: string) =>
  name
    .replace(" Train Station", "")
    .replace(" Ferry Terminal", "")
    .replace(/ \(school stop\)/, "") // Metlink
    .replace(/ ?\(hail(2| and )ride\)$/, ""); // BUSIT Waikato and Metlink

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
  gtfsModeOfTransports: Set<VehicleType>,
  gtfsItem: StopsStationsOutput["stops"][string],
  gtfsStopCode: string
) {
  const tagChanges: Record<string, string> = {};

  // 0. check the ref tag. Pointless, but included for consistency
  if (tags.ref !== gtfsStopCode) tagChanges.ref = gtfsStopCode;

  // 1. ensure base tags are defined
  const baseTags: Record<string, string> = {};
  for (const modeOfTransport of gtfsModeOfTransports) {
    Object.assign(baseTags, getStopTagsForTransportMode(modeOfTransport));
  }
  for (const [key, value] of Object.entries(baseTags)) {
    if (tags[key] !== value) {
      // don't try to add highway=bus_stop if it's mising
      // but if we're creating a brand new feature, then do add highway=bus_stop
      if (key === "highway" && Object.keys(tags).length) continue;

      tagChanges[key] = value;
    }
  }

  // 1a. special case for school-bus-only stops
  if (
    gtfsModeOfTransports.size === 1 &&
    gtfsModeOfTransports.has(VehicleType.SCHOOL_BUS)
  ) {
    if (tags.access !== "no") tagChanges.access = "no";
    if (tags.school_bus !== "designated") tagChanges.school_bus = "designated";
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
    // no name, so add it
    tagChanges.name = gtfsName;
  } else if (
    config.overrideExistingNames &&
    normalizeName(tags.name) !== normalizeName(gtfsName)
  ) {
    // optional mode:
    // we forcefully override the name tag
    tagChanges.name = gtfsName;
    if (tags.official_name) tagChanges.official_name = "🗑️";
  } else if (
    normalizeName(tags.name) !== normalizeName(gtfsName) &&
    normalizeName(tags.official_name) !== normalizeName(gtfsName)
  ) {
    // default mode:
    // respect existing names, so add the GTFS name to the official_name tag
    tagChanges.official_name = gtfsName;
  }

  // 6. sync local_ref. We also accept loc_ref, but not both
  if (gtfsItem.locRef && (tags.local_ref || tags.loc_ref) !== gtfsItem.locRef) {
    tagChanges.local_ref = gtfsItem.locRef;
  }
  if (tags.loc_ref && tags.local_ref) tagChanges.loc_ref = "🗑️";

  // 7. delete tags that duplicate each other
  if (tags.ref && tags.ref === tags.local_ref) tagChanges.local_ref = "🗑️";
  if (tags.name && tags.name === tags.official_name) {
    tagChanges.official_name = "🗑️";
  }

  return tagChanges;
}
