import { type OsmPatch, createOsmChangeXml } from 'osm-api';
import { downloadFile } from '../../../util/download.js';
import { createOsmChangeFromPatchFile } from './createOsmChangeFromPatchFile.js';
import { mergeOsmPatchFiles } from './downloadOsmPatch.js';

function safeFileName(title: string) {
  return `${title.replaceAll(/[\\/:*?"<>|]/g, '_')}.osc`;
}

export async function downloadMergedOsmChange(
  osmPatchFiles: Record<string, OsmPatch>,
) {
  const title = Object.keys(osmPatchFiles).join(';');
  const merged = mergeOsmPatchFiles(Object.values(osmPatchFiles));
  const { osmChange } = await createOsmChangeFromPatchFile(merged);
  const xml = createOsmChangeXml(-1, osmChange, merged.changesetTags);

  downloadFile(xml, safeFileName(title), 'application/xml');
}

export async function downloadSeparateOsmChangeFiles(
  osmPatchFiles: Record<string, OsmPatch>,
) {
  for (const title in osmPatchFiles) {
    const osmPatch = osmPatchFiles[title]!;
    const { osmChange } = await createOsmChangeFromPatchFile(osmPatch);
    const xml = createOsmChangeXml(-1, osmChange, osmPatch.changesetTags);

    downloadFile(xml, safeFileName(title), 'application/xml');
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}
