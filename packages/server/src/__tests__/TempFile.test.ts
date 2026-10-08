import {
  createExecutionContext,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import { type OsmChange, getUser } from 'osm-api';
import worker from '../index.js';

vi.mock('osm-api', async () => ({
  ...(await vi.importActual('osm-api')),
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

const MOCK_OSM_CHANGE: OsmChange = {
  create: [
    {
      type: 'node',
      id: -1,
      lat: -36,
      lon: 174,
      changeset: -1,
      timestamp: '',
      uid: -1,
      user: '',
      version: 0,
      tags: { amenity: 'theatre' },
    },
  ],
  modify: [],
  delete: [],
};

async function upload(body: unknown, headers?: Record<string, string>) {
  return send(
    new IncomingRequest('https://example.com/api/temp_file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer bob',
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  );
}

async function download(fileName: string) {
  return send(
    new IncomingRequest(`https://example.com/api/temp_file/${fileName}`),
  );
}

describe('temp file', () => {
  it('can upload a file, then download it without authentication', async () => {
    const uploadResponse = await upload(MOCK_OSM_CHANGE);
    const uploaded = await uploadResponse.json<{
      result: { id: string; expiresAt: string };
    }>();

    expect(uploaded).toStrictEqual({
      success: true,
      result: {
        id: expect.any(String),
        expiresAt: expect.any(String),
      },
    });
    expect(uploaded.result.id).toContain('.osc');

    const xmlResponse = await download(uploaded.result.id);
    expect(xmlResponse.headers.get('X-Forwarded-For')).toBe('exampleUser');
    const xml = await xmlResponse.text();
    expect(xml).toStrictEqual(`<osmChange version="0.6" generator="osm-api-js">
  <create>
    <node id="-1" version="0" changeset="-1" lat="-36" lon="174">
      <tag k="amenity" v="theatre"/>
    </node>
  </create>
  <modify/>
  <delete if-unused="true"/>
</osmChange>
`);
  });

  it('errors if the token is invalid', async () => {
    vi.mocked(getUser).mockRejectedValueOnce(new Error('401 Unauthorized'));

    const response = await upload(MOCK_OSM_CHANGE);
    expect(response.status).toBe(403);
  });

  it('errors if there is no token', async () => {
    const response = await upload(MOCK_OSM_CHANGE, { Authorization: '' });
    expect(response.status).toBe(400);
  });

  it('rejects files which are not a valid osmChange', async () => {
    const response = await upload({ create: [] });
    expect(response.status).toBe(400);
  });

  it('returns 404 for a file which does not exist', async () => {
    const response = await download('asjkdhfisdhfs.osc');
    expect(response.status).toBe(404);
  });
});
