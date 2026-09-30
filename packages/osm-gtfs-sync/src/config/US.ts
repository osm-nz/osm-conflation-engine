import type { NetworkConfig } from '../types/config.def.ts';

export const US: NetworkConfig[] = [
  {
    code: 'US-NY-MTA',
    networkName: 'NYC Subway',
    networkWikidata: 'Q7733',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip',
    },
  },
];
