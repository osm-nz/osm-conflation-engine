import type { NetworkConfig } from '../types/config.def.js';

export const AU: NetworkConfig[] = [
  {
    code: 'AU-NSW',
    region: 'AU-NSW',
    networkName: 'TfNSW',
    networkWikidata: 'Q7834923',
    gtfsSource: {
      mode: 'manual',
      url: 'https://opendata.transport.nsw.gov.au/dataset/timetables-complete-gtfs',
    },
    licenseWaiverUrl: 'https://osm.wiki/Contributors#Transport_for_NSW',
    bbox: {
      minLat: -34.231159,
      maxLat: -33.321949,
      minLon: 150.474865,
      maxLon: 151.567694,
    },
  },
  {
    code: 'AU-QLD-Translink-SEQ',
    region: 'AU-QLD',
    networkName: 'Translink',
    networkWikidata: 'Q7833625',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://gtfsrt.api.translink.com.au/gtfs/SEQ_SCH_GTFS.zip',
    },
    licenseWaiverUrl:
      'https://osm.wiki/Contributors#Department_of_Transport_and_Main_Roads',
  },
  {
    code: 'AU-QLD-Translink-WHT',
    region: 'AU-QLD',
    networkName: 'Translink',
    networkWikidata: 'Q7833625',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://gtfsrt.api.translink.com.au/GTFS/WHT_GTFS.zip',
    },
    licenseWaiverUrl:
      'https://osm.wiki/Contributors#Department_of_Transport_and_Main_Roads',
  },
];
