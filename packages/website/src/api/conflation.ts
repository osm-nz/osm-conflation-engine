import type {
  GetChanfanaRequest,
  GetChanfanaResponse,
  IgnoreListGet,
  IgnoreListMarkAsReviewed,
  RunHistoryGetAll,
} from '@osm-conflation-engine/server';
import { getAuthToken } from 'osm-api';

const API_BASE_URL = 'https://osm-conflation-engine.kyle.kiwi';

type WrappedResponse<T = unknown> =
  { success: true; result: T } | { success: false; errors: unknown[] };

async function wrappedFetch<T extends WrappedResponse>(
  path: string,
  options?: RequestInit,
) {
  const headers = new Headers(options?.headers);
  const authToken = getAuthToken();
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  const result = await fetch(API_BASE_URL + path, {
    ...options,
    headers,
  });
  if (result.status >= 400) {
    const body = await result.text();
    throw new Error(
      `HTTP Error ${result.status} ${result.statusText}: ${body}`,
    );
  }

  const json: T = await result.json();
  if (!json.success) {
    throw new Error(`Internal Error: ${JSON.stringify(json)}`);
  }

  return json.result as T extends WrappedResponse<infer U> ? U : never;
}

export function getAllProjects() {
  return wrappedFetch<GetChanfanaResponse<RunHistoryGetAll>>(
    '/api/run_history',
  );
}

export async function getIgnoreList(refTag: string) {
  const resp = await wrappedFetch<GetChanfanaResponse<IgnoreListGet>>(
    `/api/ignore_list/${refTag}`,
  );

  // impossible, just to keep TS happy
  return resp.filter((r) => typeof r !== 'string');
}

export function markIgnoreListAsReviewed(
  refTag: string,
  body: GetChanfanaRequest<IgnoreListMarkAsReviewed>,
) {
  return wrappedFetch<GetChanfanaResponse<IgnoreListMarkAsReviewed>>(
    `/api/ignore_list/${refTag}`,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

export type Project = Awaited<ReturnType<typeof getAllProjects>>[number];
export type IgnoredRow = Awaited<ReturnType<typeof getIgnoreList>>[number];
