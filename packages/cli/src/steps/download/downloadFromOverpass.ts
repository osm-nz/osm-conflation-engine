import { promises as fs } from 'node:fs';
import type { OsmFeature as StandardOsmFeature } from 'osm-api';
import { getHttpHeaders } from '../../constants/defaults.js';
import type { Ctx, OSMData } from '../../types/internal.def.js';
import {
  type OsmFeature,
  type OsmFeatureTypeShort,
  OsmFlags,
} from '../../types/callbacks.def.js';
import { validateOsmTagsInConfig } from './util/validateOsmTagsInConfig.js';
import {
  loadOsmFeature,
  saveLoadedOsmFeatures,
} from './util/loadOsmFeature.js';

export async function downloadFromOverpass(
  ctx: Ctx,
  queryFile: string | undefined,
  serverUrl: string | undefined,
) {
  const DEFAULT_SERVER_URL = 'https://overpass-api.de/api/interpreter';
  const DEFAULT_QUERY = `
    [out:json][timeout:480];
    nwr["${ctx.config.merge.osm_key}"];
    out meta center;
  `;

  const query = queryFile
    ? await fs.readFile(queryFile, 'utf8')
    : DEFAULT_QUERY;

  console.info('fetching OSM data via overpass…');
  const response = await fetch(
    `${serverUrl || DEFAULT_SERVER_URL}?data=${encodeURIComponent(query)}`,
    { headers: getHttpHeaders(ctx.config) },
  );
  if (!response.ok) {
    const status = (await response.text()) || response.statusText;
    throw new Error(`HTTP Error ${response.status} ${status}`);
  }

  const responseJson = (await response.json()) as {
    elements: (StandardOsmFeature & {
      center?: { lat: number; lon: number };
    })[];
  };

  const { pickTags } = validateOsmTagsInConfig(ctx);

  const out: OSMData = {
    withRef: {},
    noRef: {},
    duplicateRefs: {},
    semi: {},
    count: 0,
  };
  for (const feature of responseJson.elements) {
    const object: OsmFeature = {
      id: `${feature.type[0]! as OsmFeatureTypeShort}${feature.id}`,
      centroid:
        feature.type === 'node'
          ? [feature.lon, feature.lat]
          : feature.center
            ? [feature.center.lon, feature.center.lat]
            : [0, 0],

      tags: pickTags(feature.tags),
      metadata: {
        changeset: feature.changeset,
        timestamp: feature.timestamp,
        user: feature.user,
        version: feature.version,
      },

      // added later
      sectors: [],
      flags: OsmFlags.None,
    };
    loadOsmFeature(ctx, out, object);
  }
  await saveLoadedOsmFeatures(ctx, out);
}
