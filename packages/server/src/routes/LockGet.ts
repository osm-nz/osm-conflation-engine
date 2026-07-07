import {
  ForbiddenException,
  InternalServerErrorException,
  OpenAPIRoute,
} from 'chanfana';
import { drizzle } from 'drizzle-orm/d1';
import { z } from 'zod';
import { configure, getUser } from 'osm-api';
import { and, eq, sql } from 'drizzle-orm';
import type { AppContext } from '../types.def.js';
import { USER_AGENT } from '../constants.js';
import { LockedLayersModel, LockedLayersSchema } from '../db/LockedLayers.js';

export class LockGet extends OpenAPIRoute {
  override schema = {
    tags: ['lock'],
    summary: 'Lists all the ongoing locks',
    request: {
      params: z.object({
        refTag: LockedLayersSchema.shape.refTag,
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
        description: 'Returns the locks for a dataset was deleted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              result: z.array(LockedLayersSchema),
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
    await getUser('me').catch((ex) => {
      throw new ForbiddenException(`${ex}`);
    });
    // we do nothing with the getUser() response, we just confirm that
    // the user has an account, implying that they've agreed to the
    // TOS, and therefore we don't need to worry about returning
    // usernames in the API response.

    const db = drizzle(ctx.env.d1_db);
    const result = await db
      .select()
      .from(LockedLayersModel)
      .where(
        and(
          eq(LockedLayersModel.refTag, data.params.refTag),
          sql`datetime(${LockedLayersModel.timestamp}, '+' || ${LockedLayersModel.ttl} || ' seconds') > datetime('now')`,
        ),
      );

    return {
      success: true,
      result,
    };
  }
}
