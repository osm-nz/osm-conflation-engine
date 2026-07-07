import {
  ForbiddenException,
  InternalServerErrorException,
  OpenAPIRoute,
} from 'chanfana';
import { z } from 'zod';
import { configure, getUser } from 'osm-api';
import { drizzle } from 'drizzle-orm/d1';
import type { AppContext } from '../types.def.js';
import { USER_AGENT } from '../constants.js';
import {
  type LockedLayers,
  LockedLayersModel,
  LockedLayersSchema,
} from '../db/LockedLayers.js';

export class LockCreate extends OpenAPIRoute {
  override schema = {
    tags: ['lock'],
    summary: 'Locks a dataset, on behalf of a real person (using OAuth 2.0)',
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
        description: 'Returns the row that was upserted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              result: LockedLayersSchema,
            }),
          },
        },
      },
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

    const newRow: LockedLayers = {
      refTag: data.params.refTag,
      datasetId: data.params.datasetId,
      username: user.display_name,
      timestamp: new Date().toISOString(),
      ttl: 60 * 60, // 1 hour, can't be customized at the moment
    };

    const db = drizzle(ctx.env.d1_db);
    const result = await db
      .insert(LockedLayersModel)
      .values(newRow)
      .onConflictDoUpdate({
        target: [LockedLayersModel.refTag, LockedLayersModel.datasetId],
        set: newRow,
      })
      .returning();

    return {
      success: true,
      result: result[0],
    };
  }
}
