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
  MetricsSchema,
  type RunHistory,
  RunHistoryModel,
  RunHistorySchema,
} from '../db/index.js';
import { createOIDCAuthor, verifyOIDC } from '../auth/oidc.js';
import {
  getFlagFromWikidata,
  getImageFromOsmWikibase,
} from '../api/wikibase.js';

export class RunHistoryPut extends OpenAPIRoute {
  override schema = {
    tags: ['run_history'],
    summary: 'stores the most recent run for a given refTag',
    request: {
      params: z.object({
        refTag: RunHistorySchema.shape.refTag,
      }),
      body: contentJson(MetricsSchema),
      query: z.object({
        skipDerivedData: z
          .boolean()
          .optional()
          .describe(
            "if true, we won't generate derived data (which relies on calling other APIs)",
          ),
      }),
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
        description: 'Write successful',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              result: RunHistorySchema,
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

    const jwt = await verifyOIDC(
      data.headers.Authorization.replace('Bearer ', ''),
    );

    const region = data.body.config.metadata.region;

    const image = data.query.skipDerivedData
      ? undefined
      : await getImageFromOsmWikibase(data.params.refTag);

    const regionFlagImage = data.query.skipDerivedData
      ? undefined
      : await getFlagFromWikidata(region);

    const newRow: RunHistory = {
      refTag: data.params.refTag,
      operator: createOIDCAuthor(jwt),
      timestamp: new Date().toISOString(),
      metrics: {
        ...data.body,
        warnings: [], // don't store warnings
      },
      image: image || null,
      regionFlagImage: regionFlagImage || null,
    };

    const db = drizzle(ctx.env.d1_db);
    const result = await db
      .insert(RunHistoryModel)
      .values(newRow)
      .onConflictDoUpdate({
        target: [RunHistoryModel.refTag],
        set: newRow,
      })
      .returning();

    return {
      success: true,
      result: result[0],
    };
  }
}
