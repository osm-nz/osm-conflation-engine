import { getIDToken } from '@actions/core';
import { API_BASE_URL } from '../../../constants/defaults.js';

export async function writeToRunHistory(refTag: string) {
  if (!process.env.GITHUB_ACTIONS) {
    console.info(
      'Skipping run history update, because not running in GitHub Actions',
    );
    return;
  }
  const token = await getIDToken('osm-conflation-engine');

  const result = await fetch(`${API_BASE_URL}/api/run_history/${refTag}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (result.status !== 200) {
    throw new Error(await result.text());
  }
}
