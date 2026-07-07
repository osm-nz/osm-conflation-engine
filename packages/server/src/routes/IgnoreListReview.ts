import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  OpenAPIRoute,
  contentJson,
} from 'chanfana';
import { z } from 'zod';
import { configure, getUser } from 'osm-api';
import { drizzle } from 'drizzle-orm/d1';
import { and, eq, inArray } from 'drizzle-orm';
import type { AppContext } from '../types.def.js';
import { USER_AGENT } from '../constants.js';
import {
  type IgnoreList,
  IgnoreListModel,
  IgnoreListReviewSchema,
  IgnoreListSchema,
} from '../db/index.js';

export class IgnoreListReview extends OpenAPIRoute {
  override schema = {
    tags: ['ignore_list'],
    summary: 'Marks an ignore_list row as reviewed (approved/rejected)',
    request: {
      params: z.object({
        refTag: IgnoreListSchema.shape.refTag,
      }),
      body: contentJson(
        z.object({
          rowIds: z.array(z.string()),
          review_comment: IgnoreListReviewSchema.shape.review_comment,
          review_decision: IgnoreListReviewSchema.shape.review_decision,
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
              result: z.array(z.any()),
            }),
          },
        },
      },
      ...NotFoundException.schema(),
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
    const rows = await db
      .select()
      .from(IgnoreListModel)
      .where(
        and(
          eq(IgnoreListModel.refTag, data.params.refTag),
          inArray(IgnoreListModel.rowId, data.body.rowIds),
        ),
      );

    const results: IgnoreList[] = [];
    for (const row of rows) {
      let reviews = row.reviews || [];

      // delete any existing reviews from this user
      reviews = reviews.filter((r) => r.review_username !== user.display_name);
      reviews.push({
        review_username: user.display_name,
        review_comment: data.body.review_comment,
        review_decision: data.body.review_decision,
        review_timestamp: new Date().toISOString(),
      });
      // derived from the JSON field for faster querying
      const overallDecision = reviews.some((r) => r.review_decision === false)
        ? 0
        : reviews.length
          ? 1
          : null;

      const result = await db
        .update(IgnoreListModel)
        .set({ reviews, review_decision: overallDecision })
        .where(
          and(
            eq(IgnoreListModel.refTag, data.params.refTag),
            eq(IgnoreListModel.rowId, row.rowId),
          ),
        )
        .returning();
      results.push(...result);
    }

    return {
      success: true,
      result: results,
    };
  }
}
