import {
  ForbiddenException,
  InternalServerErrorException,
  OpenAPIRoute,
  contentJson,
} from 'chanfana';
import { bodyLimit } from 'hono/body-limit';
import { z } from 'zod';
import type { OsmChange } from 'osm-api';
import type { AppContext } from '../types.def.js';
import { verifyOsmUser } from '../auth/osm.js';
import { PayloadTooLargeException } from '../util/errors.js';

const TTL_MINUTES = 10;
const MAX_UPLOAD_SIZE_MB = 20;

export const tempFileBodyLimit = bodyLimit({
  maxSize: MAX_UPLOAD_SIZE_MB * 1024 ** 2,
  onError(ctx) {
    const error = new PayloadTooLargeException(
      `The file must be smaller than ${MAX_UPLOAD_SIZE_MB} MB`,
    );
    return ctx.json({ success: false, errors: error.buildResponse() }, 413);
  },
});

export const OsmChangeSchema = z.object({
  create: z.array(z.any()),
  modify: z.array(z.any()),
  delete: z.array(z.any()),
});

// eslint-disable-next-line no-unassigned-vars -- sanity check
let testFwd!: z.infer<typeof OsmChangeSchema>;
testFwd satisfies OsmChange;

export const TempFileSchema = z.object({
  id: z.string().describe('The ID of the temporary file'),
  expiresAt: z.string().describe('the expiry date (ISO Date)'),
});
export type TempFile = z.infer<typeof TempFileSchema>;

export class TempFileUpload extends OpenAPIRoute {
  override schema = {
    tags: ['temp_file'],
    summary:
      'Temporarily uploads an osmChange file and returns a download URL, so that it can be loaded into JOSM',
    request: {
      body: contentJson(OsmChangeSchema),
      headers: z.object({
        Authorization: z
          .string()
          .startsWith('Bearer ')
          .describe('An OSM OAuth 2.0 token'),
      }),
    },
    responses: {
      200: {
        description: 'Upload successful',
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              result: TempFileSchema,
            }),
          },
        },
      },
      ...ForbiddenException.schema(),
      ...PayloadTooLargeException.schema(),
      ...InternalServerErrorException.schema(),
    },
  };

  override async handle(ctx: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const user = await verifyOsmUser(data.headers.Authorization);

    const result: TempFile = {
      id: `${crypto.randomUUID()}.osc`,
      expiresAt: new Date(Date.now() + TTL_MINUTES * 60 * 1000).toISOString(),
    };

    await ctx.env.r2_temp_files.put(result.id, JSON.stringify(data.body), {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: {
        expiresAt: result.expiresAt,
        username: user.display_name,
      },
    });

    return { success: true, result };
  }
}
