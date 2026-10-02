import {
  ForbiddenException,
  InternalServerErrorException,
  OpenAPIRoute,
  contentJson,
} from 'chanfana';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import type { AppContext } from '../types.def.js';
import {
  type IgnoreList,
  IgnoreListModel,
  IgnoreListSchema,
} from '../db/index.js';
import { verifyOsmUser } from '../auth/osm.js';

export class IgnoreListAdd extends OpenAPIRoute {
  override schema = {
    tags: ['ignore_list'],
    summary:
      'Adds a rowId to the ignore list, on behalf of a real person (using OAuth 2.0)',
    request: {
      params: z.object({
        refTag: IgnoreListSchema.shape.refTag,
      }),
      body: contentJson(
        z.object({
          rowId: z.string(),
          note: z.string(),
          label: z.string(),
          local_key: z.string(),
        }),
      ),
      headers: z.object({
        Authorization: z
          .string()
          .startsWith('Bearer ')
          .describe('An OSM OAuth 2.0 token'),
      }),
    },
    responses: {
      200: {
        description: 'Returns the row that was inserted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              result: IgnoreListSchema,
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
    const user = await verifyOsmUser(data.headers.Authorization);

    const newRow: IgnoreList = {
      refTag: data.params.refTag,
      rowId: data.body.rowId,
      timestamp: new Date().toISOString(),
      operator: 'self',
      username: user.display_name,
      note: data.body.note,
      label: data.body.label,
      local_key: data.body.local_key,
      changeset: null,
      reviews: null,
      review_decision: null,
    };

    const db = drizzle(ctx.env.d1_db);
    const [result] = await db
      .insert(IgnoreListModel)
      .values(newRow)
      .onConflictDoUpdate({
        target: [IgnoreListModel.refTag, IgnoreListModel.rowId],
        set: newRow,
      })
      .returning();

    return {
      success: true,
      result,
    };
  }
}
