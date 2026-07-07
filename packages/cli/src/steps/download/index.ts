import type { Ctx } from '../../types/index.js';
import { downloadFromPlanetPbf } from './downloadFromPlanetPbf.js';
import { fetchIgnoreList } from './fetchIgnoreList.js';
import { osmToJson } from './osmToJson.js';

export async function download(ctx: Ctx) {
  await fetchIgnoreList(ctx);
  switch (ctx.config.o_data.source.type) {
    case 'pbf': {
      await downloadFromPlanetPbf(ctx, ctx.config.o_data.source.pbf_url);
      await osmToJson(ctx, ctx.config.o_data.source.pbf_filter);
      break;
    }

    case 'overpass': {
      throw new Error('not supported yet');
    }

    case 'postpass': {
      throw new Error('not supported yet');
    }

    default: {
      ctx.config.o_data.source satisfies never;
    }
  }
}
