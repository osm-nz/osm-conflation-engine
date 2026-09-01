import type { Context } from 'hono';
import type { z } from 'zod';
import type {
  OpenAPIRoute,
  ResponseConfig,
  ValidatedData,
  ZodContentObject,
} from 'chanfana';

export type AppContext = Context<{ Bindings: Env }>;

/** internal helper */
type _GetResponses<T extends OpenAPIRoute> =
  T['schema']['responses'][keyof T['schema']['responses']];

/**
 * given an {@link OpenAPIRoute} from chanfana, this returns a union
 * of every possible response body.
 */
export type GetChanfanaResponse<T extends OpenAPIRoute> =
  _GetResponses<T> extends ResponseConfig
    ? _GetResponses<T>['content'] extends ZodContentObject
      ? z.output<
          NonNullable<_GetResponses<T>['content']['application/json']>['schema']
        >
      : never
    : never;

export type GetChanfanaRequest<T extends OpenAPIRoute> = ValidatedData<
  T['schema']
>['body'];
