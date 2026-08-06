import { InternalServerErrorException, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import type { AppContext } from '../types.def.js';
import { RunHistoryModel, RunHistorySchema } from '../db/index.js';

export class RunHistoryGet extends OpenAPIRoute {
  override schema = {
    tags: ['run_history'],
    summary: 'Gets the most recent run for a given refTag',
    request: {
      params: z.object({
        refTag: RunHistorySchema.shape.refTag,
      }),
    },
    responses: {
      200: {
        description: 'Read successful',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              result: RunHistorySchema,
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
      .from(RunHistoryModel)
      .where(eq(RunHistoryModel.refTag, data.params.refTag));

    return {
      success: true,
      result: result[0],
    };
  }
}
