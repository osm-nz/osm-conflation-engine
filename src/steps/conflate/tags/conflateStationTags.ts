import type { Config } from "../../../types";
import type { StopsStationsOutput } from "../../readStopsFromGtfs";
import { normalizeName, transformName } from "./conflateStopTags";

const transformStationName = (name: string) =>
  name
    .replaceAll(/(\w)\/(\w)/g, "$1 / $2") // space between slashes
    .replace(/(^\/|\/$)/, ""); // leading or trailing slashes

export function conflateStationTags(
  config: Config,
  tags: Record<string, string>,
  gtfsItem: StopsStationsOutput["stations"][string],
  gtfsStationCode: string
) {
  const tagChanges: Record<string, string> = {};

  // 0. check the ref tag
  if (tags.ref !== gtfsStationCode) tagChanges.ref = gtfsStationCode;

  // 1. ensure base tags are defined
  if (tags.type !== "public_transport") tagChanges.type = "public_transport";
  if (tags.public_transport !== "stop_area") {
    tagChanges.public_transport = "stop_area";
  }

  // 2. sync name/official_name
  const gtfsName = transformStationName(transformName(gtfsItem.name));
  if (!tags.name) {
    tagChanges.name = gtfsName;
  } else if (
    normalizeName(tags.name) !== normalizeName(gtfsName) &&
    normalizeName(tags.official_name) !== normalizeName(gtfsName)
  ) {
    // respect existing names, so add the GTFS name to the official_name tag
    tagChanges.official_name = gtfsName;
  }

  return tagChanges;
}
