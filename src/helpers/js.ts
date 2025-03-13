import type { OsmPatch } from 'osm-api';

const cache = new Map<OsmPatch, string>();

/** caches the data by object reference */
export function createBlob(osmPatch: OsmPatch) {
  const cached = cache.get(osmPatch);
  if (cached) return cached;

  const blob = new Blob([JSON.stringify(osmPatch, null, 2)], {
    type: 'application/json',
  });
  const blobUrl = URL.createObjectURL(blob);
  cache.set(osmPatch, blobUrl);
  return blobUrl;
}

export function downloadBlob(fileName: string, blobUrl: string) {
  const a = document.createElement('a');
  a.style.display = 'none';
  document.body.append(a);
  a.href = blobUrl;
  a.download = fileName;
  a.click();
  a.remove();
}

export const hhmmss = {
  /** needs to handle GTFS times like 26:00:00 (26 o'clock = 2am) */
  toSeconds(str: string) {
    const [hh, mm, ss] = str.split(':').map(Number);
    return ss + 60 * mm + 60 * 60 * hh;
  },
  fromSeconds(seconds: number, stripSeconds?: boolean) {
    const parts = [
      (seconds / 60 / 60) | 0, // hh
      (seconds / 60) % 60 | 0, // mm
      seconds % 60 | 0, // ss
    ];

    // osm allows hh:mm[:ss] so remove the seconds if it's :00
    if (!parts.at(-1) || stripSeconds) parts.pop();

    return parts
      .map(String)
      .map((digit) => digit.padStart(2, '0'))
      .join(':');
  },
};
