import { GTFSBool } from 'gtfs-types';
import type { Tags } from 'osm-api';
import { getRouteTagsForTransportMode } from '../../helpers/tagging';
import type { NetworkConfig } from '../../types/config.def';
import type { GtfsDetailedRoute, Journey } from '../conflateStops';
import { getOsmRef } from '../../helpers/data';
import { hhmmss } from '../../helpers/js';
import { deleteIgnoredTags } from './tagHelpers';

// no point editting a route if it's purely to edit these tags
export const NON_MEANINGFUL_ROUTE_TAGS = new Set(['__action', 'via']);

export function conflateRouteTags(
  config: NetworkConfig,
  tags: Tags,
  gtfsRoute: GtfsDetailedRoute,
  warnings: Set<string>,
  journey: Journey | 'ROUTE_MASTER' | 'PTv1',
) {
  const tagChanges: Tags = {};

  // 0. check the ref tag
  const { key: refKey, value: ref } = getOsmRef('route', config, tags);
  if (ref !== gtfsRoute.rsn) tagChanges[refKey] = gtfsRoute.rsn;

  // 1. ensure base tags are defined
  const baseTags = getRouteTagsForTransportMode(
    gtfsRoute.vehicleType,
    warnings,
  );
  if (journey === 'ROUTE_MASTER') {
    baseTags.route_master = baseTags.route;
    delete baseTags.route;
  }
  for (const [key, value] of Object.entries(baseTags)) {
    if (tags[key] !== value) tagChanges[key] = value;
  }

  // 2. add NSI tags for network
  if (!tags.network?.split(';').includes(config.networkName)) {
    if (tags.network) {
      tagChanges.network += `;${config.networkName}`;
    } else {
      tagChanges.network = config.networkName;
    }
  }
  if (
    config.networkWikidata &&
    !tags['network:wikidata']?.split(';').includes(config.networkWikidata)
  ) {
    if (tags['network:wikidata']) {
      tagChanges['network:wikidata'] += `;${config.networkWikidata}`;
    } else {
      tagChanges['network:wikidata'] = config.networkWikidata;
    }
  }

  // 3. delete spammy NSI tags
  if (tags['network:wikipedia']) tagChanges['network:wikipedia'] = '🗑️';
  if (tags['operator:wikipedia']) tagChanges['operator:wikipedia'] = '🗑️';
  if (tags['brand:wikipedia']) tagChanges['brand:wikipedia'] = '🗑️';

  // 4. add NSI tags for operator
  const operator =
    gtfsRoute.operators
      .map((op) => config.operatorMap?.[op]?.name ?? op)
      .filter(Boolean)
      .join(';') || undefined;
  const operatorWikidata =
    gtfsRoute.operators
      .map((op) => config.operatorMap?.[op]?.wikidata ?? '')
      .filter(Boolean)
      .join(';') || undefined;

  for (const op of gtfsRoute.operators) {
    if (!config.operatorMap?.[op]) {
      const message = `Config has no defintion for operator “${op}”`;
      warnings.add(message);
    }
  }

  /**
   * if a stop is used by multiple networks, then don't try to
   * remove the operator[:*] tags because they might be from
   * another network
   */
  const hasMultipleNetworks = tags.network?.split(';').length > 1;

  if (operator) {
    // there should be an operator tag
    if (tags.operator !== operator) tagChanges.operator = operator;
  } else {
    // there should not be an operator tag
    if (tags.operator && !hasMultipleNetworks) tagChanges.operator = '🗑️';
  }

  if (operatorWikidata) {
    // there should be an operator:wikidata tag
    if (tags['operator:wikidata'] !== operatorWikidata) {
      tagChanges['operator:wikidata'] = operatorWikidata;
    }
  } else {
    // there should not be an operator:wikidata tag
    if (tags['operator:wikidata'] && !hasMultipleNetworks) {
      tagChanges['operator:wikidata'] = '🗑️';
    }
  }

  // 5. add to/from/via tags
  if (gtfsRoute.rln && journey !== 'ROUTE_MASTER') {
    const match =
      gtfsRoute.rln.match(/(.+) to (.+) via (.+)/i) ||
      gtfsRoute.rln.match(/(.+) to (.+)/i);
    if (match) {
      const [, from, to, _via] = match;
      const via = _via
        ?.replace(/\(.+\)/, '') // remove content in parenthesis
        .trim()
        .split(/ (?:and|&) /i) // split via points
        .join(';');

      // respect the value of to/from/via if they're already set
      if (!tags.to && to) tagChanges.to = to;
      if (!tags.from && from) tagChanges.from = from;
      if (!tags.via && via) tagChanges.via = via;
    }

    const match2 =
      gtfsRoute.rln.match(/(.+) - (.+) - (.+) - (.+)/i) ||
      gtfsRoute.rln.match(/(.+) - (.+) - (.+)/i) ||
      gtfsRoute.rln.match(/(.+) - (.+)/i);
    if (match2) {
      const [, a, b, c, d] = match2;

      const to = d || c || b;
      const from = a;
      const middle = d ? [b, c] : c ? [b] : [];
      const via = middle.join(';');

      // respect the value of to/from/via if they're already set
      if (!tags.to && to) tagChanges.to = to;
      if (!tags.from && from) tagChanges.from = from;
      if (!tags.via && via) tagChanges.via = via;
    }
  }

  // 6. conflate the colour=* field
  const expectedColour =
    gtfsRoute.colour && `#${gtfsRoute.colour.toLowerCase()}`;
  if (expectedColour && tags.colour !== expectedColour) {
    tagChanges.colour = expectedColour;
  }

  // 7. conflate the wheelchair=* and bicycle=* fields
  //    basically Array<yes|no|unknown> --> yes|no|limited
  for (const key of <const>['wheelchair', 'bicycle']) {
    if (journey !== 'ROUTE_MASTER') {
      // for PTv1, use every journey merged together
      const merged =
        journey === 'PTv1'
          ? gtfsRoute.journeys.reduce(
              (ac, item) => ac.union(item[key]),
              new Set<GTFSBool>(),
            )
          : journey[key];

      if (merged.size === 1) {
        // easy, only 1 value
        const [bool] = merged;
        if (bool === GTFSBool.YES && tags[key] !== 'yes') {
          tagChanges[key] = 'yes';
        }
        if (bool === GTFSBool.NO && tags[key] !== 'no') {
          tagChanges[key] = 'no';
        }
      } else {
        // there are conflicting values
        if (merged.has(GTFSBool.YES) && merged.has(GTFSBool.NO)) {
          // explicitly conflicting
          if (tags[key] !== 'limited') tagChanges[key] = 'limited';
        } else {
          // not really conflicting, some trips are just missing
          // information. So we won't try to add any data.
        }
      }
    }
  }

  // 8. conflate duration
  if (journey !== 'ROUTE_MASTER') {
    const durations =
      journey === 'PTv1'
        ? gtfsRoute.journeys.flatMap((x) => x.duration)
        : journey.duration;
    if (new Set(durations).size === 1) {
      // exactly 1 duration, easy. override the existing
      const expected = hhmmss.fromSeconds(durations[0], true);
      if (tags.duration !== expected) tagChanges.duration = expected;
    } else {
      // multiple durations, maybe bc of traffic or whatever
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      const parsed = hhmmss.toSeconds(tags.duration || '');
      if (Number.isNaN(parsed) || parsed < min || parsed > max) {
        // either there's no value, or it's outside the range. So we need
        // to set the duration tag to something. There are 4 options:
        // median, mean, midpoint, or range.
        // For now, we're using the range.
        tagChanges.duration = `${hhmmss.fromSeconds(min, true)}-${hhmmss.fromSeconds(max, true)}`;
      }
    }
  }

  deleteIgnoredTags(config, tagChanges);
  return tagChanges;
}
