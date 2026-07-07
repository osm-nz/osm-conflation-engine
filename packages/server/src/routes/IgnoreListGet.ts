import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import type { AppContext } from '../types.def.js';
import { IgnoreListModel, IgnoreListSchema } from '../db/index.js';

export class IgnoreListGet extends OpenAPIRoute {
  override schema = {
    tags: ['ignore_list'],
    summary: 'Lists every ID that has been ignored for a given dataset',
    request: {
      params: z.object({
        refTag: IgnoreListSchema.shape.refTag,
      }),
      query: z.object({
        return_ids_only: z
          .boolean()
          .optional()
          .describe('if true, only IDs will be returned, no other columns'),
      }),
    },
    responses: {
      200: {
        description: 'Returns a list of IDs that have been ignored',
        content: {
          'application/json': {
            schema: z.object({
              rows: z.array(IgnoreListSchema),
            }),
          },
        },
      },
    },
  };

  override async handle(ctx: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const db = drizzle(ctx.env.d1_db);

    if (data.query.return_ids_only) {
      const result = await db
        .select({ rowId: IgnoreListModel.rowId })
        .from(IgnoreListModel)
        .where(eq(IgnoreListModel.refTag, data.params.refTag));

      return {
        success: true,
        rows: result.map((r) => r.rowId),
      };
    }

    const result = await db
      .select()
      .from(IgnoreListModel)
      .where(eq(IgnoreListModel.refTag, data.params.refTag));

    return {
      success: true,
      rows: result,
    };
  }
}
