import {
  ForbiddenException,
  InternalServerErrorException,
  OpenAPIRoute,
  contentJson,
} from 'chanfana';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import type { AppContext } from '../types.def.js';
import {
  MetricsSchema,
  type RunHistory,
  RunHistoryModel,
  RunHistorySchema,
} from '../db/index.js';
import { LockedLayersModel } from '../db/LockedLayers.js';
import { createOIDCAuthor, verifyOIDC } from '../auth/oidc.js';
import {
  getFlagFromWikidata,
  getImageFromOsmWikibase,
} from '../api/wikibase.js';
import { verifyOsmUser } from '../auth/osm.js';
import { getStaticFilesUrl } from '../util/oidc.js';

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
            'An OSM OAuth 2.0 token, or an OIDC JWT Token issused by the CI/CD provider (such as GitHub Actions)',
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

    const authToken = data.headers.Authorization.replace('Bearer ', '');

    let operator: string;
    if (authToken.includes('.')) {
      // likely to be a JWT
      const jwt = await verifyOIDC(authToken);
      operator = createOIDCAuthor(jwt);
    } else {
      // all other non-JWT-like tokens are forwarded to OSM.org to verify
      const user = await verifyOsmUser(data.headers.Authorization);
      operator = user.display_name;
    }

    const region = data.body.config.metadata.region;

    const image = data.query.skipDerivedData
      ? undefined
      : await getImageFromOsmWikibase(data.body.config.merge.osm_key).catch(
          (ex) => {
            console.error(ex);
            return undefined;
          },
        );

    const regionFlagImage = data.query.skipDerivedData
      ? undefined
      : await getFlagFromWikidata(region).catch((ex) => {
          console.error(ex);
          return undefined;
        });

    const newRow: RunHistory = {
      refTag: data.params.refTag,
      operator,
      timestamp: new Date().toISOString(),
      metrics: {
        ...data.body,
        warnings: [], // don't store warnings
      },
      extra: {
        image,
        regionFlagImage,
      },
    };

    const db = drizzle(ctx.env.d1_db);

    const [existingRow] = await db
      .select()
      .from(RunHistoryModel)
      .where(eq(RunHistoryModel.refTag, data.params.refTag));

    if (
      existingRow &&
      !!getStaticFilesUrl(existingRow.operator) !==
        !!getStaticFilesUrl(operator)
    ) {
      throw new ForbiddenException(
        'Not allowed to switch between OIDC auth and user auth.',
      );
    }

    const [result] = await db.batch([
      // create/update the new row:
      db
        .insert(RunHistoryModel)
        .values(newRow)
        .onConflictDoUpdate({
          target: [RunHistoryModel.refTag],
          set: newRow,
        })
        .returning(),
      // and wipe the list of locked layers:
      db
        .delete(LockedLayersModel)
        .where(eq(LockedLayersModel.refTag, data.params.refTag)),
    ]);

    return {
      success: true,
      result: result[0],
    };
  }
}
