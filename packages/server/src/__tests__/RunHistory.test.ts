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

describe('run_history', () => {
  it('returns the most recent run', async () => {
    const response = await send(
      new IncomingRequest('https://example.com/api/run_history/ref:example'),
    );

    expect(await response.json()).toStrictEqual({
      success: true,
      result: {
        refTag: 'ref:example',
        operator: 'https://github.com/example/example/actions/runs/2#octocat',
        timestamp: '2021-06-17T00:00:00.000Z',
      },
    });
  });

  it('overwrites the previous run for the same refTag', async () => {
    const putResponse = await send(
      new IncomingRequest('https://example.com/api/run_history/ref:example', {
        method: 'PUT',
        headers: { Authorization: inject('MOCK_OIDC_TOKEN') },
      }),
    );
    expect(putResponse.status).toBe(200);

    const { result } = (await send(
      new IncomingRequest('https://example.com/api/run_history/ref:example'),
    ).then((r) => r.json())) as { result: unknown };

    expect(result).toStrictEqual({
      refTag: 'ref:example',
      operator:
        'https://github.com/octo-org/octo-repo/actions/runs/example-run-id#octocat',
      timestamp: expect.any(String),
    });
    expect(result).not.toHaveProperty('timestamp', '2021-06-17T00:00:00.000Z'); // should not be the old value
  });

  it('can add a run', async () => {
    const newRow = {
      refTag: 'my_key',
      operator:
        'https://github.com/octo-org/octo-repo/actions/runs/example-run-id#octocat',
      timestamp: expect.any(String),
    };

    const putResponse = await send(
      new IncomingRequest('https://example.com/api/run_history/my_key', {
        method: 'PUT',
        headers: { Authorization: inject('MOCK_OIDC_TOKEN') },
      }),
    );
    expect(await putResponse.json()).toStrictEqual({
      success: true,
      result: newRow,
    });

    expect(
      await send(
        new IncomingRequest('https://example.com/api/run_history/my_key'),
      ).then((r) => r.json()),
    ).toStrictEqual({ success: true, result: newRow });
  });
});
