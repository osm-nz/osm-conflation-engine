import {
  API_BASE_URL,
  IS_UNIT_TEST,
  getHttpHeaders,
} from '../../../constants/defaults.js';
import type {
  ConflateResult,
  RecursiveHistoryFile,
  RecursiveHistoryRow,
} from '../../../types/callbacks.def.js';
import type { Ctx } from '../../../types/internal.def.js';

export const RECURSIVE_HISTORY_FILE_NAME = 'metrics-history.json';

const EMPTY_HISTORY = () => ({ lastUpdated: '', rows: [] });

export async function amendRecursiveHistory(ctx: Ctx, metrics: ConflateResult) {
  const refTag = ctx.config.merge.osm_key;

  const historyFile: RecursiveHistoryFile = IS_UNIT_TEST
    ? EMPTY_HISTORY()
    : await fetch(
        `${API_BASE_URL}/api/static/${refTag}/${RECURSIVE_HISTORY_FILE_NAME}`,
        { headers: getHttpHeaders(ctx.config) },
      ).then(async (response) => {
        if (!response.ok) {
          const status = (await response.text()) || response.statusText;
          const error = new Error(`HTTP Error ${response.status} ${status}`);
          if (response.status === 404) {
            const wrapped = new ReferenceError(
              'Recursive History does not exist, presumably this is the first run. History will be reset',
              { cause: error },
            );
            console.error(wrapped);
            return EMPTY_HISTORY();
          }
          throw error;
        }
        return (await response.json()) as RecursiveHistoryFile;
      });

  // mock the date in the test environment, otherwise the snapshot would update each time
  const date = IS_UNIT_TEST
    ? 'MOCK'
    : new Date().toISOString().split('T', 1)[0]!;

  const stats: RecursiveHistoryRow = {
    date,
    conflated: metrics.countsByPhase.conflated,
  };

  // don't create a duplicate row. the date is in the row so this is safe
  const latestRow = historyFile.rows.at(-1);
  if (JSON.stringify(latestRow) === JSON.stringify(stats)) {
    console.info('No change in statistics, not updating table');
  } else {
    historyFile.rows.push(stats);
  }

  historyFile.lastUpdated = date;

  return historyFile;
}
