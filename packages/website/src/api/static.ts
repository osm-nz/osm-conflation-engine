import type {
  ConflateResult,
  IndexFile,
  RecursiveHistoryFile,
} from '@osm-conflation-engine/cli';
import type { OsmPatch } from 'osm-api';
import { API_BASE_URL } from './conflation.js';

export async function fetchStaticFile<T>(
  refTag: string,
  file: string,
  plainText?: boolean,
) {
  const result = await fetch(`${API_BASE_URL}/api/static/${refTag}/${file}`);
  if (!result.ok) {
    throw new Error(`HTTP Error ${result.status} ${result.statusText}`);
  }
  const output = (plainText ? await result.text() : await result.json()) as T;
  return output;
}

export function getMetrics(refTag: string) {
  return fetchStaticFile<ConflateResult>(refTag, 'metrics.json');
}

export function getMetricsHistory(refTag: string) {
  return fetchStaticFile<RecursiveHistoryFile>(refTag, 'metrics-history.json');
}

export function getIndex(refTag: string) {
  return fetchStaticFile<IndexFile>(refTag, 'index.geo.json');
}

export function getDataset(refTag: string, datasetId: string) {
  return fetchStaticFile<OsmPatch>(
    refTag,
    `datasets/${datasetId}.osmPatch.geo.json`,
  );
}
