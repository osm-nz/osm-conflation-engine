import type { OsmPatch } from 'osm-api';
import { downloadFile } from '../../../util/download.js';
import { isTruthy } from '../../../util/object.js';
import { mergeTags } from '../../../util/osm.js';

export function join(values: (string | undefined)[]) {
  const unique = [...new Set(values.filter(Boolean))];
  return unique.length ? unique.join('\n\n') : undefined;
}

export function mergeOsmPatchFiles(osmPatchFiles: OsmPatch[]): OsmPatch {
  const changesetTags = mergeTags(
    ...osmPatchFiles.map((f) => f.changesetTags).filter(isTruthy),
  );

  const merged: OsmPatch = {
    type: 'FeatureCollection',
    __comment: join(osmPatchFiles.map((osmPatch) => osmPatch.__comment)),
    instructions: join(osmPatchFiles.map((osmPatch) => osmPatch.instructions)),
    changesetTags,
    features: osmPatchFiles.flatMap((osmPatch) => osmPatch.features),
  };
  return merged;
}

function safeFileName(title: string) {
  return `${title.replaceAll(/[\\/:*?"<>|]/g, '_')}.osmPatch.geo.json`;
}

export function downloadMergedOsmPatch(
  osmPatchFiles: Record<string, OsmPatch>,
) {
  const title = Object.keys(osmPatchFiles).join(';');
  const merged = mergeOsmPatchFiles(Object.values(osmPatchFiles));

  downloadFile(merged, safeFileName(title));
}

export async function downloadSeparateOsmPatches(
  osmPatchFiles: Record<string, OsmPatch>,
) {
  for (const title in osmPatchFiles) {
    downloadFile(osmPatchFiles[title], safeFileName(title));
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}
