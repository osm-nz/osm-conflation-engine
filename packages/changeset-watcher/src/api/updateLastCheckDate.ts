import { API_BASE_URL } from '../constants.js';
import type { ChangesetWatchConfig } from '../types.def.js';

export async function updateLastCheckDate(config: ChangesetWatchConfig) {
  const result = await fetch(
    `${API_BASE_URL}/api/changeset_watch/check_date/${config.refTag}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${config.authToken}` },
    },
  );
  if (result.status !== 200) {
    throw new Error(await result.text());
  }
}
