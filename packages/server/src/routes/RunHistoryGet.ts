import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { desc, eq } from 'drizzle-orm';
import type { AppContext } from '../types.def.js';
import { RunHistoryModel, RunHistorySchema } from '../db/index.js';

/** the maximum number of runs returned for a single refTag */
const LIMIT = 100;

export class RunHistoryGet extends OpenAPIRoute {
  override schema = {
    tags: ['run_history'],
    summary: 'Lists the run history for a given refTag',
    request: {
      params: z.object({
        refTag: RunHistorySchema.shape.refTag,
      }),
    },
    responses: {
      200: {
        description: `Returns the ${LIMIT} most recent runs, newest first`,
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              result: z.array(RunHistorySchema),
            }),
          },
        },
      },
    },
  };

  override async handle(ctx: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const db = drizzle(ctx.env.d1_db);

    const result = await db
      .select()
      .from(RunHistoryModel)
      .where(eq(RunHistoryModel.refTag, data.params.refTag))
      .orderBy(desc(RunHistoryModel.timestamp))
      .limit(LIMIT);

    return {
      success: true,
      result,
    };
  }
}
