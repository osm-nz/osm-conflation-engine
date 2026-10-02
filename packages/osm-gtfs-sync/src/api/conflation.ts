import { getAuthToken } from 'osm-api';
import type { ConflateResult } from '@osm-conflation-engine/cli';

export const API_BASE_URL = 'https://osm-conflation-engine.kyle.kiwi';

export async function writeToRunHistory(code: string, metrics: ConflateResult) {
  const token = getAuthToken();
  if (!token) throw new Error('Not logged in');
  const result = await fetch(
    `${API_BASE_URL}/api/run_history/::gtfs::${code}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(metrics),
    },
  );
  if (result.status !== 200) {
    throw new Error(await result.text());
  }
}
