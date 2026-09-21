import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  OpenAPIRoute,
} from 'chanfana';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import type { AppContext } from '../types.def.js';
import { RunHistoryModel, RunHistorySchema } from '../db/index.js';
import { getStaticFilesUrl } from '../util/oidc.js';
import { USER_AGENT } from '../constants.js';

export class StaticProxy extends OpenAPIRoute {
  override schema = {
    tags: ['static'],
    summary:
      "Proxies a file from the CI's conflation results, to avoid CORS issues",
    request: {
      params: z.object({
        refTag: RunHistorySchema.shape.refTag,
        file: z.string().min(1).describe('The relative path of the file'),
      }),
    },
    responses: {
      200: {
        description: 'The proxied response',
        content: { '*/*': { schema: z.unknown() } },
      },
      ...ForbiddenException.schema(),
      ...NotFoundException.schema(),
      ...InternalServerErrorException.schema(),
    },
  };

  override async handle(ctx: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const db = drizzle(ctx.env.d1_db);
    const [run] = await db
      .select({ operator: RunHistoryModel.operator })
      .from(RunHistoryModel)
      .where(eq(RunHistoryModel.refTag, data.params.refTag));

    if (!run) throw new NotFoundException('Invalid refTag');

    const baseUrl = getStaticFilesUrl(run.operator);
    if (!baseUrl) throw new ForbiddenException('Invalid OIDC URL'); // impossible

    const url = new URL(data.params.file, baseUrl);
    if (!url.href.startsWith(baseUrl)) {
      throw new ForbiddenException('Invalid file path');
    }

    const response = await fetch(url.href, {
      headers: { 'User-Agent': USER_AGENT },
    });

    return response;
  }
}
