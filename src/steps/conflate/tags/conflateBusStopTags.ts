import type { Config } from "../../../types";
import type { StopsStationsOutput } from "../../readStopsFromGtfs";

export function conflateBusStopTags(
  config: Config,
  tags: Record<string, string>,
  gtfsItem: StopsStationsOutput["stops"][string]
) {
  const tagChanges: Record<string, string> = {};

  // no need to check ref, because it must be correct for us to get here

  // 1. upgrade to PTv2 tagging schema
  if (tags.public_transport !== "platform") {
    tagChanges.public_transport = "platform";
  }
  if (tags.bus !== "yes") {
    tagChanges.bus = "yes";
  }

  // 2. add NSI tags for network
  if (tags.network !== config.networkName!) {
    tagChanges.network = config.networkName!;
  }
  if (config.networkWikidata && tags.network !== config.networkWikidata!) {
    tagChanges["network:wikidata"] = config.networkWikidata;
  }

  // 3. delete spammy NSI tags
  if (tags["network:wikipedia"]) {
    tagChanges["network:wikipedia"] = "🗑️";
  }

  // 4. delete redundant operator tags that duplicate the network tag
  if (tags.operator === config.networkWikidata!) tagChanges.operator = "🗑️";
  if (
    config.networkWikidata &&
    tags["operator:wikidata"] === config.networkWikidata
  ) {
    tagChanges["operator:wikidata"] = "🗑️";
  }

  // 5. sync name/official_name
  if (!tags.name) {
    tagChanges.name = gtfsItem.name;
  } else if (
    tags.name !== gtfsItem.name &&
    tags.official_name !== gtfsItem.name
  ) {
    // respect existing names, so add the GTFS name to the official_name tag
    tagChanges.official_name = gtfsItem.name;
  }

  // 6. sync local_ref
  if (gtfsItem.locRef && tags.local_ref !== gtfsItem.locRef) {
    tagChanges.local_ref = gtfsItem.locRef;
  }

  return tagChanges;
}
