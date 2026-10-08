import {
  createExecutionContext,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, inject, it, vi } from 'vitest';
import { getUser } from 'osm-api';
import worker from '../index.js';
import { MOCK_METRICS } from './setup-tests.js';

vi.mock('../auth/oidc', async () => ({
  ...(await vi.importActual('../auth/oidc')),
  verifyOIDC: async (jwt: string) => JSON.parse(atob(jwt.split('.', 2)[1]!)),
}));

vi.mock('osm-api', async () => ({
  ...(await vi.importActual('osm-api')),
  configure: vi.fn(),
  getUser: vi.fn(async () => ({
    display_name: 'exampleUser',
    roles: [],
    account_created: new Date('2018-01-01'),
    changesets: { count: 123 },
    blocks: { received: { count: 0, active: 0 } },
  })),
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
        operator:
          'https://github.com/octo-org/octo-repo/actions/runs/2#octocat',
        timestamp: '2021-06-17T00:00:00.000Z',
        metrics: MOCK_METRICS,
        extra: {},
      },
    });
  });

  it('returns the whole table, newest first', async () => {
    const response = await send(
      new IncomingRequest('https://example.com/api/run_history'),
    );

    expect(await response.json()).toStrictEqual({
      success: true,
      result: [
        {
          refTag: 'ref:other',
          operator:
            'https://github.com/octo-org/octo-repo/actions/runs/3#octocat',
          timestamp: '2021-07-17T00:00:00.000Z',
          metrics: MOCK_METRICS,
          extra: {},
        },
        {
          refTag: 'ref:example',
          operator:
            'https://github.com/octo-org/octo-repo/actions/runs/2#octocat',
          timestamp: '2021-06-17T00:00:00.000Z',
          metrics: MOCK_METRICS,
          extra: {},
        },
      ],
    });
  });

  it('overwrites the previous run for the same refTag', async () => {
    const putResponse = await send(
      new IncomingRequest(
        'https://example.com/api/run_history/ref:example?skipDerivedData=true',
        {
          method: 'PUT',
          headers: { Authorization: inject('MOCK_OIDC_TOKEN') },
          body: JSON.stringify(MOCK_METRICS),
        },
      ),
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
      metrics: MOCK_METRICS,
      extra: {},
    });
    expect(result).not.toHaveProperty('timestamp', '2021-06-17T00:00:00.000Z'); // should not be the old value
  });

  it.each([
    {
      refTag: 'my_oidc_key',
      Authorization: inject('MOCK_OIDC_TOKEN'),
      operator:
        'https://github.com/octo-org/octo-repo/actions/runs/example-run-id#octocat',
      isUser: false,
    },
    {
      refTag: 'my_user_key',
      Authorization: 'Bearer bob',
      operator: 'exampleUser',
      isUser: true,
    },
  ])(
    'can add a run ($refTag)',
    async ({ refTag, Authorization, operator, isUser }) => {
      const newRow = {
        refTag,
        operator,
        timestamp: expect.any(String),
        metrics: MOCK_METRICS,
        extra: {},
      };

      const putResponse = await send(
        new IncomingRequest(
          `https://example.com/api/run_history/${refTag}?skipDerivedData=true`,
          {
            method: 'PUT',
            headers: { Authorization },
            body: JSON.stringify(MOCK_METRICS),
          },
        ),
      );
      expect(await putResponse.json()).toStrictEqual({
        success: true,
        result: newRow,
      });

      expect(
        await send(
          new IncomingRequest(`https://example.com/api/run_history/${refTag}`),
        ).then((r) => r.json()),
      ).toStrictEqual({ success: true, result: newRow });

      if (isUser) {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(getUser).toHaveBeenCalledWith('me');
      } else {
        // eslint-disable-next-line vitest/no-conditional-expect
        expect(getUser).not.toHaveBeenCalled();
      }
    },
  );

  it.each([
    {
      label: 'OIDC -> user',
      first: inject('MOCK_OIDC_TOKEN'),
      second: 'Bearer bob',
    },
    {
      label: 'user -> OIDC',
      first: 'Bearer bob',
      second: inject('MOCK_OIDC_TOKEN'),
    },
  ])(
    'cannot change the auth method ($label)',
    async ({ label, first, second }) => {
      const refTag = `switch_from_${label}`;

      function put(Authorization: string) {
        return send(
          new IncomingRequest(
            `https://example.com/api/run_history/${refTag}?skipDerivedData=true`,
            {
              method: 'PUT',
              headers: { Authorization },
              body: JSON.stringify(MOCK_METRICS),
            },
          ),
        );
      }

      expect((await put(first)).status).toBe(200);

      const rejected = await put(second);
      expect(rejected.status).toBe(403);
      expect(await rejected.json()).toMatchObject({
        success: false,
        errors: [
          { message: 'Not allowed to switch between OIDC auth and user auth.' },
        ],
      });
    },
  );
});
