import { existsSync, promises as fs } from 'node:fs';
import { geoCentroid } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import type { Tags } from 'osm-api';
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

type PostpassResponse = FeatureCollection<
  Geometry,
  {
    osm_type: Uppercase<OsmFeatureTypeShort>;
    osm_id: number;
    tags: Tags;
  }
>;

export async function downloadFromPostpass(
  ctx: Ctx,
  queryFile: string | undefined,
  serverUrl: string | undefined,
) {
  const cacheFile = ctx.tempFileNames.postpass;

  if (ctx.use_cache && existsSync(cacheFile)) {
    console.info('Using cached postpass response');
    const cached: OSMData = JSON.parse(await fs.readFile(cacheFile, 'utf8'));
    await saveLoadedOsmFeatures(ctx, cached);
    return;
  }

  const DEFAULT_SERVER_URL = 'https://postpass.geofabrik.de/api/interpreter';
  const DEFAULT_QUERY = `
    SELECT osm_type, osm_id, tags, ST_PointOnSurface(geom) AS geom
    FROM postpass_pointlinepolygon
    WHERE tags ? '${ctx.config.merge.osm_key}'
  `;

  const query = queryFile
    ? await fs.readFile(queryFile, 'utf8')
    : DEFAULT_QUERY;

  console.info('fetching OSM data via postpass…');
  const response = await fetch(serverUrl || DEFAULT_SERVER_URL, {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
    headers: getHttpHeaders(ctx.config),
  });
  if (!response.ok) {
    const status = (await response.text()) || response.statusText;
    throw new Error(`HTTP Error ${response.status} ${status}`);
  }

  const responseJson = (await response.json()) as PostpassResponse;

  const { pickTags } = validateOsmTagsInConfig(ctx);

  const out: OSMData = {
    withRef: {},
    noRef: {},
    duplicateRefs: {},
    semi: {},
    count: 0,
  };
  for (const feature of responseJson.features) {
    const { osm_type, osm_id, tags } = feature.properties;
    const object: OsmFeature = {
      id: `${osm_type.toLowerCase() as OsmFeatureTypeShort}${osm_id}`,
      centroid: feature.geometry ? geoCentroid(feature.geometry) : [0, 0],

      tags: pickTags(tags),
      metadata: undefined, // not supported by postpass

      // added later
      sectors: [],
      flags: OsmFlags.None,
    };
    loadOsmFeature(ctx, out, object);
  }

  await fs.writeFile(cacheFile, JSON.stringify(out));
  await saveLoadedOsmFeatures(ctx, out);
}
