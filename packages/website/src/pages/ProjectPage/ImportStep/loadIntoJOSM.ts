import type { OsmPatch } from 'osm-api';
import { API_BASE_URL, uploadTempFile } from '../../../api/conflation.js';
import { createOsmChangeFromPatchFile } from './createOsmChangeFromPatchFile.js';
import { mergeOsmPatchFiles } from './downloadOsmPatch.js';

export async function loadIntoJOSM(osmPatchFiles: Record<string, OsmPatch>) {
  const title = Object.keys(osmPatchFiles).join(';');
  const merged = mergeOsmPatchFiles(Object.values(osmPatchFiles));
  const { osmChange } = await createOsmChangeFromPatchFile(merged);

  // JOSM can't load blob: or data: URLs, so we first
  // need to temporarily upload the file to our server.
  const { id } = await uploadTempFile(osmChange);

  // docs: https://josm.openstreetmap.de/wiki/Help/RemoteControlCommands
  const qs = new URLSearchParams({
    new_layer: 'true',
    layer_name: title,
    changeset_tags: Object.entries(merged.changesetTags || {})
      .map((kv) => kv.join('=').replaceAll('|', encodeURIComponent('|')))
      .join('|'),
    url: `${API_BASE_URL}/api/temp_file/${id}`,
  });
  // based on https://github.com/openstreetmap/openstreetmap-website/blob/97d908/app/assets/javascripts/index.js#L247
  await fetch(`http://127.0.0.1:8111/import?${qs}`, {
    mode: 'no-cors',
    signal: AbortSignal.timeout(5000),
  });
}
