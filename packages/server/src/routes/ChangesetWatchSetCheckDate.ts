import {
  ForbiddenException,
  InternalServerErrorException,
  OpenAPIRoute,
} from 'chanfana';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import type { AppContext } from '../types.def.js';
import { createOIDCAuthor, verifyOIDC } from '../auth/oidc.js';
import {
  type ChangesetWatchCheckDate,
  ChangesetWatchCheckDateModel,
  ChangesetWatchCheckDateSchema,
} from '../db/index.js';

export class ChangesetWatchSetCheckDate extends OpenAPIRoute {
  override schema = {
    tags: ['changeset_watch'],
    summary: 'Stores the timestamp when the changeset_watch script last ran',
    request: {
      params: z.object({
        refTag: ChangesetWatchCheckDateSchema.shape.refTag,
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
              result: ChangesetWatchCheckDateSchema,
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
    const newRow: ChangesetWatchCheckDate = {
      refTag: data.params.refTag,
      operator: createOIDCAuthor(jwt),
      timestamp: new Date().toISOString(),
    };

    const db = drizzle(ctx.env.d1_db);
    const result = await db
      .insert(ChangesetWatchCheckDateModel)
      .values(newRow)
      .onConflictDoUpdate({
        target: [ChangesetWatchCheckDateModel.refTag],
        set: newRow,
      })
      .returning();

    return {
      success: true,
      result: result[0],
    };
  }
}
