import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  OpenAPIRoute,
} from 'chanfana';
import { z } from 'zod';
import { configure, getUser } from 'osm-api';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq } from 'drizzle-orm';
import type { AppContext } from '../types.def.js';
import { USER_AGENT } from '../constants.js';
import { LockedLayersModel, LockedLayersSchema } from '../db/LockedLayers.js';

export class LockDelete extends OpenAPIRoute {
  override schema = {
    tags: ['lock'],
    summary: 'Unlocks a dataset, on behalf of a real person (using OAuth 2.0)',
    request: {
      params: z.object({
        refTag: LockedLayersSchema.shape.refTag,
        datasetId: LockedLayersSchema.shape.datasetId,
      }),
      headers: z.object({
        Authorization: z
          .string()
          .startsWith('Bearer ')
          .describe('An OSM OAuth 2.0 token'),
      }),
    },
    responses: {
      200: {
        description: 'Returns the row that was deleted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
            }),
          },
        },
      },
      ...ConflictException.schema(),
      ...ForbiddenException.schema(),
      ...InternalServerErrorException.schema(),
    },
  };

  override async handle(ctx: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    configure({
      authHeader: data.headers.Authorization,
      userAgent: USER_AGENT,
    });
    // this will throw an error if the token is invalid
    const user = await getUser('me').catch((ex) => {
      throw new ForbiddenException(`${ex}`);
    });

    const db = drizzle(ctx.env.d1_db);
    const result = await db
      .delete(LockedLayersModel)
      .where(
        and(
          eq(LockedLayersModel.refTag, data.params.refTag),
          eq(LockedLayersModel.datasetId, data.params.datasetId),
          eq(LockedLayersModel.username, user.display_name),
        ),
      );

    if (!result.meta.changes) {
      throw new ConflictException('There is no matching lock.');
    }

    return {
      success: true,
    };
  }
}
