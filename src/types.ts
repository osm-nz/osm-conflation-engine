import { VehicleType } from "gtfs-types";

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
  /** stations to ignore */
  ignoreStations?: string[];
  /** routes to ignore */
  ignoreRoutes?: string[];

  /** you can change the mode of transport for certain route if they're defined wrong */
  overrideTransportMode?: {
    [rsn: string]: VehicleType;
  };

  /**
   * by default, stops are excluded from route relations if <10% of trips stop there.
   * This can optionally be disabled by setting this option to `true`
   */
  includeAllStops?: boolean;

  /** optional mode to override the existing `name` tag, instead of using `official_name` */
  overrideExistingNames?: boolean;
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
