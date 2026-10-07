import {
  InternalServerErrorException,
  NotFoundException,
  OpenAPIRoute,
} from 'chanfana';
import { z } from 'zod';
import { type OsmChange, createOsmChangeXml } from 'osm-api';
import type { AppContext } from '../types.def.js';
import { GoneException } from '../util/errors.js';

export class TempFileGet extends OpenAPIRoute {
  override schema = {
    tags: ['temp_file'],
    summary: 'Downloads a temporary osmChange file',
    request: {
      params: z.object({
        fileName: z
          .string()
          .regex(/^[\w\d-]+\.osc$/)
          .describe('The ID of the temporary file'),
      }),
    },
    responses: {
      200: {
        description: 'The osmChange file',
        content: { 'application/xml': { schema: z.string() } },
      },
      ...NotFoundException.schema(),
      ...GoneException.schema(),
      ...InternalServerErrorException.schema(),
    },
  };

  override async handle(ctx: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const file = await ctx.env.r2_temp_files.get(data.params.fileName);

    const { expiresAt, username } = file?.customMetadata || {};
    if (!file) throw new NotFoundException('not found');
    if (!expiresAt || new Date(expiresAt) < new Date()) {
      throw new GoneException('expired');
    }

    const osmChange = await file.json<OsmChange>();
    const xml = createOsmChangeXml(-1, osmChange);
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'X-Forwarded-For': encodeURIComponent(username!),
      },
    });
  }
}
