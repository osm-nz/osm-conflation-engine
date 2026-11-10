import type { Stop } from 'gtfs-types';
import type { Tags } from 'osm-api';
import type { NetworkConfig } from '../types/config.def.js';
import pkg from '../../package.json' with { type: 'json' };
import { getNetwork } from '../conflate/tags/conflateStopTags.ts';

/**
 * Some datasets don't specify a `stop_code`, and just
 * use a the `stop_id` for a human-readable ID.
 */
export function getStopCode(stop: Stop, config: NetworkConfig) {
  if (config.useStopId) return stop.stop_id;
  return stop.stop_code || stop.stop_id;
}

export type BaseRole = 'stop' | 'platform' | 'entrance';
export function getBaseRole(tags: Tags | undefined): BaseRole | undefined {
  if (
    tags?.entrance ||
    tags?.railway === 'train_station_entrance' ||
    tags?.railway === 'subway_entrance'
  ) {
    return 'entrance';
  }

  if (tags?.highway === 'bus_stop' || tags?.public_transport === 'platform') {
    return 'platform';
  }

  if (tags?.public_transport === 'stop_position') {
    return 'stop';
  }

  return undefined;
}

/**
 * If multiple feeds use the same stop, use the ID for this
 * feed, falling back to `ref`.
 */
export function getOsmRef(
  type: 'entrance' | 'stop' | 'route',
  network: NetworkConfig,
  tags: Tags | undefined,
) {
  const keys: string[] = [];

  if (type !== 'entrance') {
    // for entrances, ref is basically the local_ref, so we exclude it
    keys.unshift('ref');
  }

  if (type === 'stop' || type === 'entrance') {
    keys.unshift(
      `gtfs:stop_code:${network.code}`,
      `gtfs:stop_id:${network.code}`,
      // these tags are deprecated:
      'gtfs:stop_code',
      'gtfs:stop_id',
      'stop_id',
    );
  }

  if (type === 'route') {
    keys.unshift(
      `gtfs:route_short_name:${network.code}`,
      `gtfs:route_id:${network.code}`,
    );
  }

  for (const key of keys) {
    const value = tags?.[key];
    if (value) return { key, value };
  }
  const defaultKey =
    type === 'entrance'
      ? `gtfs:${network.useStopId ? 'stop_id' : 'stop_code'}:${network.code}`
      : 'ref';
  return { key: defaultKey, value: undefined };
}

export function getChangesetTags(network: NetworkConfig) {
  return {
    created_by: `osm-gtfs-sync ${pkg.version}`,
    source: `GTFS feed for ${getNetwork(network.networkName, [])}`,
  };
}
