import {
  createExecutionContext,
  waitOnExecutionContext,
  // @ts-expect-error -- known issue https://github.com/cloudflare/cloudflare-docs/issues/30069
} from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../index.js';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

async function run(refTag: string, file: string) {
  const request = new IncomingRequest(
    `https://custom.example.org/api/static/${refTag}/${file}`,
  );
  const ctx = createExecutionContext();
  const response = await worker.fetch(request, env, ctx);
  await waitOnExecutionContext(ctx);
  return response;
}

describe('static proxy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each`
    file                       | expectedUrl
    ${'metrics.json'}          | ${'https://octo-org.github.io/octo-repo/metrics.json'}
    ${'some/nested/file.json'} | ${'https://octo-org.github.io/octo-repo/some/nested/file.json'}
  `('can proxy $file', async ({ file, expectedUrl }) => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ abc: 123 }));

    const response = await run('ref:example', file);

    expect(await response.json()).toStrictEqual({ abc: 123 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
  });

  it('rejects unknown refTags', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = await run('ref:unknown', 'metrics.json');
    expect(response.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it.each`
    file
    ${'../other/metrics.json'}
    ${'/other/metrics.json'}
    ${'//evil.com/metrics.json'}
    ${'https://octo-org.github.io/other/metrics.json'}
    ${'https://evil.example.net/other/metrics.json'}
  `('rejects $file', async ({ file }) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = await run('ref:example', encodeURIComponent(file));
    expect(response.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
