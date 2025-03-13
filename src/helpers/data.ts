import type { Stop } from 'gtfs-types';
import type { Tags } from 'osm-api';
import type { NetworkConfig } from '../types/config.def';
import { version } from '../../package.json';

/**
 * Some datasets don't specify a `stop_code`, and just
 * use a the `stop_id` for a human-readable ID.
 */
export function getStopCode(stop: Stop) {
  return stop.stop_code || stop.stop_id;
}

export type BaseRole = 'stop' | 'platform';
export function getBaseRole(tags: Tags | undefined): BaseRole | undefined {
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
  type: 'stop' | 'route',
  network: NetworkConfig,
  tags: Tags | undefined,
) {
  const keys = ['ref'];
  if (type === 'stop') {
    keys.unshift(
      `gtfs:stop_code:${network.code}`,
      `gtfs:stop_id:${network.code}`,
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
  return { key: 'ref', value: undefined };
}

export function getChangesetTags(network: NetworkConfig) {
  return {
    created_by: `osm-gtfs-sync ${version}`,
    source: `GTFS feed for ${network.networkName}`,
  };
}
