import { API_BASE_URL } from '../constants.js';
import type { ChangesetWatchConfig, IgnoreList } from '../types.def.js';

export async function updateIgnoreList(
  config: ChangesetWatchConfig,
  rows: IgnoreList[],
) {
  const result = await fetch(
    `${API_BASE_URL}/api/ignore_list/${config.refTag}/batch`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.authToken}` },
      body: JSON.stringify({ rows }),
    },
  );
  if (result.status !== 200) {
    throw new Error(await result.text());
  }
}
