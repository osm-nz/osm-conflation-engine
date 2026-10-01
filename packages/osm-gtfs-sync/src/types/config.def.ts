import type { VehicleType } from 'gtfs-types';

export interface BBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface NetworkConfig {
  /**
   * used when mutliple feeds use the same stop, but
   * each feed has a different ID. For a list, see
   * https://taginfo.osm.org/search?q=gtfs:stop_id:
   * or the (ostensibly exhaustive) list at
   * https://osm.wiki/List_of_GTFS_feeds
   */
  code: string;

  /** region or subdivison code */
  region: string;

  gtfsSource: {
    url: string;
    /**
     * Google Maps requires each feed to provide a direct download URL.
     * However, this direct download URL is often not publicised.
     * Instead, other consumers have to download the zip file through
     * a different portal, which might require authentication.
     */
    mode:
      /**
       * A script cannot download the feed automatically.
       * Maybe the publisher forces you to login, or accept
       * terms&conditions on every download.
       */
      | 'manual'
      /**
       * A script can fetch the GTFS feed using this URL, but
       * it will cause a CORS error if fetched from a browser.
       */
      | 'automatic'
      /**
       * A script can fetch the GTFS feed using this URL,
       * and the CORS headers allow any website to access it.
       */
      | 'automatic_and_CORS';
  };

  /** the value for the `network=*` tag in this city */
  networkName: string;
  /** the value for the `network:wkidata=*` tag in this city */
  networkWikidata: string;

  /** if undefined, the UI won't let you import this dataset */
  licenseWaiverUrl: string | undefined;

  /**
   * the value for the `operator=*` and `operator:wkidata=*` tags on each route
   * @key gtfsAgencyName
   */
  operatorMap?: {
    [gtfsName: string]: {
      name: string;
      wikidata: string;
    };
  };

  /** the bbox to search use, by default it's the extent of the GTFS data. */
  bbox?: BBox;

  /**
   * stopCodes to ignore. Set the value to `null` to completey ignore it, or set the value
   * to a replacement stopCode so that all routes that officially use the stopCode get
   * changed to the replacement stopCode
   * @key stopCode
   */
  ignoreStops?: {
    [stopCode: string]: string | null;
  };
  /** stations to ignore */
  ignoreStations?: string[];
  /** routes to ignore */
  ignoreRoutes?: string[];

  /** tags that should not be conflated */
  ignoreTags?: (
    'colour' | 'wheelchair' | 'bicycle' | 'duration' | 'operator[:*]'
  )[];
  /**
   * you can change the mode of transport for certain route if they're defined wrong
   * @key rsn
   */
  overrideTransportModes?: Record<string, VehicleType>;

  /**
   * by default, stops are excluded from route relations if <10% of trips stop there.
   * This can optionally be disabled by setting this option to `true`
   */
  includeAllStops?: boolean;

  /** optional mode to override the existing `name` tag, instead of using `official_name` */
  overrideExistingNames?: boolean;

  /** If `true`, we will ignore the `stop_code` and only use the `stop_id` */
  useStopId?: boolean;
}

export type DownloadType = NetworkConfig['gtfsSource']['mode'];
