import type { NetworkConfig } from '../types/config.def.js';

export const CA: NetworkConfig[] = [
  {
    code: 'CA-QC-STLevis',
    networkName: 'STLévis',
    networkWikidata: 'Q3488027',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://www.stlevis.ca/sites/default/files/public/assets/gtfs/transit/gtfs_stlevis.zip',
    },
    licenseWaiverUrl: 'https://osm.wiki/Contributors#Lévis',
  },
];
