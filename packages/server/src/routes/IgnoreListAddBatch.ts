import {
  ForbiddenException,
  InternalServerErrorException,
  OpenAPIRoute,
  UnauthorizedException,
  contentJson,
} from 'chanfana';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import type { AppContext } from '../types.def.js';
import { createOIDCAuthor, verifyOIDC } from '../auth/oidc.js';
import {
  type IgnoreList,
  IgnoreListModel,
  IgnoreListSchema,
} from '../db/index.js';

export class IgnoreListAddBatch extends OpenAPIRoute {
  override schema = {
    tags: ['ignore_list'],
    summary:
      'Adds multiple rowId to the ignore list, on behalf of a robot (using OIDC)',
    request: {
      params: z.object({
        refTag: IgnoreListSchema.shape.refTag,
      }),
      body: contentJson(
        z.object({
          rows: z.array(
            z.object({
              rowId: IgnoreListSchema.shape.rowId,
              changeset: IgnoreListSchema.shape.changeset.nonoptional(),
              note: IgnoreListSchema.shape.note,
              label: IgnoreListSchema.shape.label,
              local_key: IgnoreListSchema.shape.local_key,
              username: IgnoreListSchema.shape.username,
              timestamp: IgnoreListSchema.shape.timestamp,
            }),
          ),
        }),
      ),
      headers: z.object({
        Authorization: z
          .string()
          .startsWith('Bearer ')
          .describe(
            'An OIDC JWT Token issused by the CI/CD provider (such as GitHub Actions)',
          ),
      }),
    },
    responses: {
      200: {
        description: 'Returns the rows that were inserted',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              result: z.array(IgnoreListSchema),
            }),
          },
        },
      },
      ...UnauthorizedException.schema(),
      ...ForbiddenException.schema(),
      ...InternalServerErrorException.schema(),
    },
  };

  override async handle(ctx: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const jwt = await verifyOIDC(
      data.headers.Authorization.replace('Bearer ', ''),
    );

    const db = drizzle(ctx.env.d1_db);
    const results: IgnoreList[] = [];

    // d1 doesn't support transactions...
    // https://github.com/drizzle-team/drizzle-orm/issues/2463

    for (const options of data.body.rows) {
      const row: IgnoreList = {
        refTag: data.params.refTag,
        rowId: options.rowId,
        timestamp: options.timestamp,
        operator: createOIDCAuthor(jwt),
        username: options.username,
        note: options.note,
        changeset: options.changeset,
        label: options.label,
        local_key: options.local_key,
        reviews: null,
        review_decision: null,
      };
      const result = await db
        .insert(IgnoreListModel)
        .values(row)
        .onConflictDoUpdate({
          target: [IgnoreListModel.refTag, IgnoreListModel.rowId],
          set: row,
        })
        .returning();
      results.push(...result);
    }

    return {
      success: true,
      result: results,
    };
  }
}
