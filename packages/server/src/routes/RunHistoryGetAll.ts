import { InternalServerErrorException, OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { desc } from 'drizzle-orm';
import type { AppContext } from '../types.def.js';
import { RunHistoryModel, RunHistorySchema } from '../db/index.js';

export class RunHistoryGetAll extends OpenAPIRoute {
  override schema = {
    tags: ['run_history'],
    summary: 'Gets the most recent run for every refTag',
    responses: {
      200: {
        description: 'Read successful, newest first',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              result: z.array(RunHistorySchema),
            }),
          },
        },
      },
      ...InternalServerErrorException.schema(),
    },
  };

  override async handle(ctx: AppContext) {
    await this.getValidatedData<typeof this.schema>();

    const db = drizzle(ctx.env.d1_db);
    const result = await db
      .select()
      .from(RunHistoryModel)
      .orderBy(desc(RunHistoryModel.timestamp));

    return {
      success: true,
      result,
    };
  }
}
