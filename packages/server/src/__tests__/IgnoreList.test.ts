import {
  createExecutionContext,
  waitOnExecutionContext,
  // @ts-expect-error -- known issue https://github.com/cloudflare/cloudflare-docs/issues/30069
} from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, inject, it, vi } from 'vitest';
import worker from '../index.js';

vi.mock('osm-api', async () => ({
  ...(await vi.importActual('osm-api')),
  getUser: async () => ({ display_name: 'exampleUser' }),
}));
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

describe('ignore_list', () => {
  it('returns the ignore list for a given key', async () => {
    const request = new IncomingRequest(
      'https://example.com/api/ignore_list/ref:example',
    );
    const response = await send(request);

    expect(await response.json()).toStrictEqual({
      success: true,
      rows: [
        {
          refTag: 'ref:example',
          rowId: 'row1',
          changeset: null,
          note: 'hii i clicked ignoree~',
          label: 'Hadestown',
          local_key: '12 Example Street',
          operator: 'self',
          username: 'kylenz_linz',
          review_decision: null,
          reviews: null,
          timestamp: '2021-04-06T11:48:15.611Z',
        },
      ],
    });
  });

  it('returns nothing for a key that does not exist', async () => {
    const request = new IncomingRequest(
      'https://example.com/api/ignore_list/invaliddd',
    );
    const response = await send(request);
    expect(await response.json()).toStrictEqual({ success: true, rows: [] });
  });

  it('errors if no authentication provided', async () => {
    const request = new IncomingRequest(
      'https://example.com/api/ignore_list/my_key',
      {
        method: 'POST',
        body: JSON.stringify({
          rowId: 'row2',
          note: 'test',
          label: 'Townsville',
          local_key: '123 Main Road',
        }),
      },
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

  it('can add an item to the ignore list on behalf of a user', async () => {
    const request = new IncomingRequest(
      'https://example.com/api/ignore_list/my_key',
      {
        method: 'POST',
        headers: { Authorization: 'Bearer bob' },
        body: JSON.stringify({
          rowId: 'row2',
          note: 'test',
          label: 'Townsville',
          local_key: '123 Main Road',
        }),
      },
    );
    const response = await send(request);

    const newRow = {
      changeset: null,
      label: 'Townsville',
      local_key: '123 Main Road',
      note: 'test',
      operator: 'self',
      refTag: 'my_key',
      review_decision: null,
      reviews: null,
      rowId: 'row2',
      timestamp: expect.any(String),
      username: 'exampleUser',
    };
    expect(await response.json()).toStrictEqual({
      success: true,
      result: newRow,
    });

    // check that the GET API returns this new row
    expect(
      await send(
        new IncomingRequest('https://example.com/api/ignore_list/my_key'),
      ).then((r) => r.json()),
    ).toStrictEqual({ success: true, rows: [newRow] });
  });

  it('can add an item to the ignore list on behalf of a robot', async () => {
    const request = new IncomingRequest(
      'https://example.com/api/ignore_list/my_key2/batch',
      {
        method: 'POST',
        headers: { Authorization: inject('MOCK_OIDC_TOKEN') },
        body: JSON.stringify({
          rows: [
            {
              rowId: 'row2',
              note: 'test',
              label: 'Townsville',
              local_key: '456 Main Road',
              changeset: 456,
              username: 'some_other_user',
              timestamp: 'whenever',
            },
          ],
        }),
      },
    );
    const response = await send(request);

    const newRow = {
      changeset: 456,
      label: 'Townsville',
      local_key: '456 Main Road',
      note: 'test',
      operator:
        'https://github.com/octo-org/octo-repo/actions/runs/example-run-id#octocat',
      refTag: 'my_key2',
      review_decision: null,
      reviews: null,
      rowId: 'row2',
      timestamp: 'whenever',
      username: 'some_other_user',
    };
    expect(await response.json()).toStrictEqual({
      success: true,
      result: [newRow],
    });

    // check that the GET API returns this new row
    expect(
      await send(
        new IncomingRequest('https://example.com/api/ignore_list/my_key2'),
      ).then((r) => r.json()),
    ).toStrictEqual({ success: true, rows: [newRow] });
  });
});
