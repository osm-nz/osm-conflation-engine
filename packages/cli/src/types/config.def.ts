// this file is the canonical source, the JSON schema
// is generated based on this file.

export interface Config {
  $schema:
    | (string & {})
    | 'https://unpkg.com/@osm-conflation-engine/cli/dist/config.schema.json'
    | 'node_modules/@osm-conflation-engine/cli/config.schema.json';

  metadata: {
    /** format should be `https://github.com/a/b` */
    git_repository: string;
    name: string;
    description: string;
    wiki_page: string;
    region: string;
  };

  source_data: {
    type: 'file';
    file: string;
  };

  o_data: {
    /**
     * if you choose `pbf`, you should also define an environment
     * variable called `OSM_AUTH`, so that metadata can be considered
     * by the algorithm.
     */
    source:
      | {
          type: 'pbf';
          /**
           * A URL to download the pbf file for your local area, this should
           * ideally use `osm-internal.download.geofabrik.de` to ensure that
           * metadata is available.
           *
           * For unit tests only, you can use a path to a file on disk instead
           * of a URL.
           */
          pbf_url: string;
          /** the filter expression which is passed to {@link https://github.com/pelias/pbf2json#usage the pbf2json library}. */
          pbf_filter: string[];
        }
      | {
          type: 'overpass';
          /** if a query is not supplied, we will try to download all features with `Config.merge.osm_key` */
          overpass_query_file?: string;
          /** optional, if you want to use a different server. Use the full URL (domain + path) */
          overpass_server_url?: string;
        }
      | {
          type: 'postpass';
          postpass_query_file: string;
          postpass_server_url?: string;
        };

    /** if the value starts and ends with `/`, then it's considered a regex */
    tags_to_keep: string[];
    check_date_key?: string;
  };

  merge: {
    /** the key */
    osm_key: string;
    /** the column in the dataset */
    dataset_column: string;
    /** optional, passed to {@link https://h3geo.org h3} @default 3 */
    sector_resolution?: number;
    hash?: {
      // TODO: this is not implemented
      /** if true, the coordinates will be part of the hash */
      location: boolean;
      columns: string[];
    };
  };

  output?: {
    folder?: string;
    // TODO: this is not used
    changeset_tags?: {
      [key: string]: string;
    };
  };

  e2e_tests?: {
    ignore_list_file_path?: string;
  };
}
