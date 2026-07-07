import { API_BASE_URL } from '../constants.js';
import type { ChangesetWatchCheckDate } from '../types.def.js';

export async function getLastCheckDate(refTag: string): Promise<string> {
  const result = await fetch(
    `${API_BASE_URL}/api/changeset_watch/check_date/${refTag}`,
  );
  if (result.status !== 200) {
    throw new Error(await result.text());
  }
  const body = (await result.json()) as { result?: ChangesetWatchCheckDate };
  console.info('Last checked', body.result);

  if (!body.result) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    console.warn('first time running, so only checking the past 1 day', d);
    return d.toISOString();
  }

  return body.result.timestamp;
}
