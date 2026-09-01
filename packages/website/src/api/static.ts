import type { ConflateResult, IndexFile } from '@osm-conflation-engine/cli';
import { type Operator, getBaseUrl } from '../util/conflation.js';

export async function getMetrics(operator: Operator) {
  const result = await fetch(`${getBaseUrl(operator)}/metrics.json`);
  const json: ConflateResult = await result.json();
  return json;
}

export async function getIndex(operator: Operator) {
  const result = await fetch(`${getBaseUrl(operator)}/index.geo.json`);
  const json: IndexFile = await result.json();
  return json;
}
