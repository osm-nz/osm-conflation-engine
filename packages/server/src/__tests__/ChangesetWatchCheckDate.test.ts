import {
  createExecutionContext,
  waitOnExecutionContext,
  // @ts-expect-error -- known issue https://github.com/cloudflare/cloudflare-docs/issues/30069
} from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, inject, it, vi } from 'vitest';
import worker from '../index.js';

vi.mock('../auth/oidc', async () => ({
  ...(await vi.importActual('../auth/oidc')),
  verifyOIDC: async (jwt: string) => JSON.parse(atob(jwt.split('.', 2)[1]!)),
}));

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

async function send(request: Request) {
  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

describe('changeset_watch/check_date', () => {
  it('can return existing rows', async () => {
    const request = new IncomingRequest(
      'https://example.com/api/changeset_watch/check_date/ref:example',
    );
    const response = await send(request);

    expect(await response.json()).toStrictEqual({
      success: true,
      result: {
        refTag: 'ref:example',
        timestamp: '2021-05-17',
        operator: 'https://github.com/example/example',
      },
    });
  });

  it('errors if no authentication provided', async () => {
    const request = new IncomingRequest(
      'https://example.com/api/changeset_watch/check_date/ref:example',
      { method: 'PUT' },
    );
    const response = await send(request);
    expect(await response.json()).toStrictEqual({
      success: false,
      errors: [
        {
          code: 7001,
          message: 'Invalid input: expected string, received null',
          path: ['headers', 'Authorization'],
        },
      ],
      result: {},
    });
  });

  it('can update the check_date', async () => {
    const lockResponse = await send(
      new IncomingRequest(
        'https://example.com/api/changeset_watch/check_date/my_key',
        {
          method: 'PUT',
          headers: { Authorization: inject('MOCK_OIDC_TOKEN') },
        },
      ),
    );

    const newRow = {
      refTag: 'my_key',
      operator:
        'https://github.com/octo-org/octo-repo/actions/runs/example-run-id#octocat',
      timestamp: expect.any(String),
    };
    expect(await lockResponse.json()).toStrictEqual({
      success: true,
      result: newRow,
    });

    // check that the GET API returns the new row
    expect(
      await send(
        new IncomingRequest(
          'https://example.com/api/changeset_watch/check_date/my_key',
        ),
      ).then((r) => r.json()),
    ).toStrictEqual({ success: true, result: newRow });
  });
});
