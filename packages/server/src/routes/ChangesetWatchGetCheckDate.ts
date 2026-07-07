import { InternalServerErrorException, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import type { AppContext } from '../types.def.js';
import {
  ChangesetWatchCheckDateModel,
  ChangesetWatchCheckDateSchema,
} from '../db/index.js';

export class ChangesetWatchGetCheckDate extends OpenAPIRoute {
  override schema = {
    tags: ['changeset_watch'],
    summary: 'Gets the timestamp when the changeset_watch script last ran',
    request: {
      params: z.object({
        refTag: ChangesetWatchCheckDateSchema.shape.refTag,
      }),
    },
    responses: {
      200: {
        description: 'Read successful',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              result: ChangesetWatchCheckDateSchema,
            }),
          },
        },
      },
      ...InternalServerErrorException.schema(),
    },
  };

  override async handle(ctx: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const db = drizzle(ctx.env.d1_db);
    const result = await db
      .select()
      .from(ChangesetWatchCheckDateModel)
      .where(eq(ChangesetWatchCheckDateModel.refTag, data.params.refTag));

    return {
      success: true,
      result: result[0],
    };
  }
}
