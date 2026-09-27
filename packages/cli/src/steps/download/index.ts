import { existsSync } from 'node:fs';
import type { Ctx } from '../../types/index.js';
import { downloadFromOverpass } from './downloadFromOverpass.js';
import { downloadFromPlanetPbf } from './downloadFromPlanetPbf.js';
import { downloadFromPostpass } from './downloadFromPostpass.js';
import { fetchIgnoreList } from './fetchIgnoreList.js';
import { osmToJson } from './osmToJson.js';

export async function download(ctx: Ctx) {
  await fetchIgnoreList(ctx);

  if (ctx.use_cache && existsSync(ctx.tempFileNames.osm_processed_other)) {
    console.info('Using cached OSM data');
    return;
  }

  switch (ctx.config.osm_data.source.type) {
    case 'pbf': {
      await downloadFromPlanetPbf(ctx, ctx.config.osm_data.source.pbf_url);
      await osmToJson(ctx, ctx.config.osm_data.source.pbf_filter);
      break;
    }

    case 'overpass': {
      await downloadFromOverpass(
        ctx,
        ctx.config.osm_data.source.overpass_query_file,
        ctx.config.osm_data.source.overpass_server_url,
      );
      break;
    }

    case 'postpass': {
      await downloadFromPostpass(
        ctx,
        ctx.config.osm_data.source.postpass_query_file,
        ctx.config.osm_data.source.postpass_server_url,
      );
      break;
    }

    default: {
      throw new TypeError(ctx.config.osm_data.source satisfies never);
    }
  }
}
