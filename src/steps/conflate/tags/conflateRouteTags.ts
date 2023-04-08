import type { Config } from "../../../types";
import { getRouteTagForTransportMode } from "../../../constants";
import { FinalGTFSOutput } from "../../processStopTimes";

export function conflateRouteTags(
  config: Config,
  tags: Record<string, string>,
  gtfsRoute: FinalGTFSOutput[string],
  rsn: string
) {
  const tagChanges: Record<string, string> = {};

  // 0. check the ref tag. Pointless, but included for consistency
  if (tags.ref !== rsn) tagChanges.ref = rsn;

  // 1. ensure base tags are defined
  const routeTagValue = getRouteTagForTransportMode(gtfsRoute.vehicleType);
  if (tags.route !== routeTagValue) tagChanges.route = routeTagValue;

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

  // 4. add NSI tags for operator
  const operator =
    gtfsRoute.operators.map((op) => op.split("🫶")[0]).join(";") || undefined;
  const operatorWikidata =
    gtfsRoute.operators.map((op) => op.split("🫶")[1]).join(";") || undefined;

  if (operator) {
    // there should be an operator tag
    if (tags.operator !== operator) tagChanges.operator = operator;
  } else {
    // there should not be an operator tag
    if (tags.operator) tagChanges.operator = "🗑️";
  }

  if (operatorWikidata) {
    // there should be an operator:wikidata tag
    if (tags["operator:wikidata"] !== operatorWikidata) {
      tagChanges["operator:wikidata"] = operatorWikidata;
    }
  } else {
    // there should not be an operator:wikidata tag
    if (tags["operator:wikidata"]) tagChanges["operator:wikidata"] = "🗑️";
  }

  return tagChanges;
}
