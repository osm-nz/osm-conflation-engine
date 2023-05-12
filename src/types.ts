export type Config = {
  /** the value for the `network=*` tag in this city */
  networkName?: string;
  /** the value for the `network:wkidata=*` tag in this city */
  networkWikidata?: string;
  /** the value for the `operator=*` and `operator:wkidata=*` tages on each route */
  operatorMap?: {
    [operatorName: string]: { name: string; wikidata: "" };
  };
  /** the bbox to search use, by default it's the extent of the GTFS data. */
  bbox?: BBox;
  /**
   * stopCodes to ignore. Set the value to `null` to completey ignore it, or set the value
   * to a replacement stopCode so that all routes that officially use the stopCode get
   * changed to the replacement stopCode
   */
  ignoreStops?: {
    [stopCode: string]: string | null;
  };
  /** routes to ignore */
  ignoreRoutes?: string[];
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
