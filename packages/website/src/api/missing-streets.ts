/** copy-pasted from that repo, as an interim solution */
export namespace MissingStreets {
  export interface RegionMetadata {
    code: string;
    name: string;
    icon: string;
    image: string;
    source: string;
    centroid: { lat: number; lon: number };
    defaultImagery?: string;
    defaultImageryOverlays?: string[];
  }

  export interface StatsRow {
    /** ISO Date */
    date: string;
    regions: {
      [region: string]: {
        issues: number;
        totalDataset: number;
        totalOsm: number;
      };
    };
  }

  export interface StatsFile {
    /** ISO Date */
    lastUpdated: string;
    operator: string;
    rows: StatsRow[];
    metadata: RegionMetadata[];
  }
}

export async function getMissingStreets() {
  const response = await fetch(
    'https://osm-nz.github.io/missing-streets/stats.json',
  );
  const json: MissingStreets.StatsFile = await response.json();
  return json;
}
