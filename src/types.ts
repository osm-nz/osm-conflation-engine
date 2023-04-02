export type Config = {
  networkName?: string;
  networkWikidata?: string;
  operatorMap?: {
    [operatorName: string]: { name: string; wikidata: "" };
  };
  bbox?: BBox;
};

export type BBox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

declare global {
  // still no typedefs for node18's fetch
  const fetch: typeof import("node-fetch")["default"];
}
