import type { ConflateResult, IndexFile } from '@osm-conflation-engine/cli';
import type { OsmPatch } from 'osm-api';
import { API_BASE_URL } from './conflation.js';

async function fetchStaticFile<T>(refTag: string, file: string) {
  const result = await fetch(`${API_BASE_URL}/api/static/${refTag}/${file}`);
  if (!result.ok) {
    throw new Error(`HTTP Error ${result.status} ${result.statusText}`);
  }
  const json: T = await result.json();
  return json;
}

export function getMetrics(refTag: string) {
  return fetchStaticFile<ConflateResult>(refTag, 'metrics.json');
}

export function getIndex(refTag: string) {
  return fetchStaticFile<IndexFile>(refTag, 'index.geo.json');
}

export function getDataset(refTag: string, datasetId: string) {
  return fetchStaticFile<OsmPatch>(
    refTag,
    `suburbs/${datasetId}.osmPatch.geo.json`,
  );
}
