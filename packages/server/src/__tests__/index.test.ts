import {
  createExecutionContext,
  waitOnExecutionContext,
  // @ts-expect-error -- known issue https://github.com/cloudflare/cloudflare-docs/issues/30069
} from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import worker from '../index.js';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('example test case', () => {
  it('renders the docs page', async () => {
    const request = new IncomingRequest('https://example.com');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(await response.text()).toContain('a');
  });
});
