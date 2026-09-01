import { getIDToken } from '@actions/core';
import { API_BASE_URL, IS_UNIT_TEST } from '../../../constants/defaults.js';
import type { ConflateResult } from '../../../types/callbacks.def.js';

export async function writeToRunHistory(metrics: ConflateResult) {
  if (IS_UNIT_TEST) return;
  if (!process.env.GITHUB_ACTIONS) {
    console.info(
      'Skipping run history update, because not running in GitHub Actions',
    );
    return;
  }
  const token = await getIDToken('osm-conflation-engine');

  const refTag = metrics.config.merge.osm_key;
  const result = await fetch(`${API_BASE_URL}/api/run_history/${refTag}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(metrics),
  });
  if (result.status !== 200) {
    throw new Error(await result.text());
  }
}
