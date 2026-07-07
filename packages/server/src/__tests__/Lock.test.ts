import {
  createExecutionContext,
  waitOnExecutionContext,
  // @ts-expect-error -- known issue https://github.com/cloudflare/cloudflare-docs/issues/30069
} from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import worker from '../index.js';

vi.mock('osm-api', async () => ({
  ...(await vi.importActual('osm-api')),
  getUser: async () => ({ display_name: 'exampleUser' }),
}));

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

async function send(request: Request) {
  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

describe('lock', () => {
  it('does not return locks that have expired', async () => {
    const request = new IncomingRequest(
      'https://example.com/api/lock/ref:example',
      { headers: { Authorization: 'Bearer bear' } },
    );
    const response = await send(request);

    expect(await response.json()).toStrictEqual({
      success: true,
      result: [
        {
          // only 1 row returned, not r2 which is expired
          datasetId: 'r1',
          refTag: 'ref:example',
          timestamp: '2045-01-01',
          ttl: 3600,
          username: 'userA',
        },
      ],
    });
  });

  it('errors if no authentication provided', async () => {
    const request = new IncomingRequest(
      'https://example.com/api/lock/ref:example',
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

  it('can lock and unlock a dataset', async () => {
    const lockResponse = await send(
      new IncomingRequest('https://example.com/api/lock/my_key/row1', {
        method: 'PUT',
        headers: { Authorization: 'Bearer bob' },
      }),
    );

    const newRow = {
      refTag: 'my_key',
      datasetId: 'row1',
      timestamp: expect.any(String),
      ttl: 3600,
      username: 'exampleUser',
    };
    expect(await lockResponse.json()).toStrictEqual({
      success: true,
      result: newRow,
    });

    // check that the GET API returns this new row
    expect(
      await send(
        new IncomingRequest('https://example.com/api/lock/my_key', {
          headers: { Authorization: 'Bearer bear' },
        }),
      ).then((r) => r.json()),
    ).toStrictEqual({ success: true, result: [newRow] });

    // try manually unlock it
    const unlockResponse = await send(
      new IncomingRequest('https://example.com/api/lock/my_key/row1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer bob' },
      }),
    );
    expect(await unlockResponse.json()).toStrictEqual({
      success: true,
    });

    // check that the GET API returns nothing now
    expect(
      await send(
        new IncomingRequest('https://example.com/api/lock/my_key', {
          headers: { Authorization: 'Bearer bear' },
        }),
      ).then((r) => r.json()),
    ).toStrictEqual({ success: true, result: [] });
  });
});
