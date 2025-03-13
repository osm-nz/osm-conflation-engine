import { z } from 'zod';
import { VehicleType } from 'gtfs-types';

export const BBox = z.object({
  minLon: z.number(),
  minLat: z.number(),
  maxLon: z.number(),
  maxLat: z.number(),
});
export type BBox = typeof BBox._type;

export const NetworkConfig = z.object({
  /**
   * used when mutliple feeds use the same stop, but
   * each feed has a different ID. For a list, see
   * https://taginfo.osm.org/search?q=gtfs:stop_id:
   * or the (ostensibly exhaustive) list at
   * https://osm.wiki/List_of_GTFS_feeds
   */
  code: z.string(),

  gtfsSource: z.object({
    url: z.string(),
    /**
     * Google Maps requires each feed to provide a direct download URL.
     * However, this direct download URL is often not publicised.
     * Instead, other consumers have to download the zip file through
     * a different portal, which might require authentication.
     */
    mode: z.union([
      /**
       * A script cannot download the feed automatically.
       * Maybe the publisher forces you to login, or accept
       * terms&conditions on every download.
       */
      z.literal('manual'),
      /**
       * A script can fetch the GTFS feed using this URL, but
       * it will cause a CORS error if fetched from a browser.
       */
      z.literal('automatic'),
      /**
       * A script can fetch the GTFS feed using this URL,
       * and the CORS headers allow any website to access it.
       */
      z.literal('automatic_and_CORS'),
    ]),
  }),

  /** the value for the `network=*` tag in this city */
  networkName: z.string(),
  /** the value for the `network:wkidata=*` tag in this city */
  networkWikidata: z.string(),

  /**
   * the value for the `operator=*` and `operator:wkidata=*` tags on each route
   * @key gtfsAgencyName
   */
  operatorMap: z
    .record(z.object({ name: z.string(), wikidata: z.string() }))
    .optional(),

  /** the bbox to search use, by default it's the extent of the GTFS data. */
  bbox: BBox.optional(),

  /**
   * stopCodes to ignore. Set the value to `null` to completey ignore it, or set the value
   * to a replacement stopCode so that all routes that officially use the stopCode get
   * changed to the replacement stopCode
   * @key stopCode
   */
  ignoreStops: z.record(z.union([z.string(), z.null()])).optional(),
  /** stations to ignore */
  ignoreStations: z.array(z.string()).optional(),
  /** routes to ignore */
  ignoreRoutes: z.array(z.string()).optional(),

  /** tags that should not be conflated */
  ignoreTags: z
    .array(
      z.union([
        z.literal('colour'),
        z.literal('wheelchair'),
        z.literal('bicycle'),
        z.literal('duration'),
        z.literal('operator[:*]'),
      ]),
    )
    .optional(),

  /**
   * you can change the mode of transport for certain route if they're defined wrong
   * @key rsn
   */
  overrideTransportModes: z.record(z.nativeEnum(VehicleType)).optional(),

  /**
   * by default, stops are excluded from route relations if <10% of trips stop there.
   * This can optionally be disabled by setting this option to `true`
   */
  includeAllStops: z.boolean().optional(),

  /** optional mode to override the existing `name` tag, instead of using `official_name` */
  overrideExistingNames: z.boolean().optional(),
});
export type NetworkConfig = typeof NetworkConfig._type;

export type DownloadType = NetworkConfig['gtfsSource']['mode'];

export const ConfigSchema = z.object({
  $schema: z.string().optional(),
  networks: z.array(NetworkConfig),
});
export type ConfigSchema = typeof ConfigSchema._type;
