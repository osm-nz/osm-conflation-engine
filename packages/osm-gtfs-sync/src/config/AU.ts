import type { NetworkConfig } from '../types/config.def.js';

export const AU: NetworkConfig[] = [
  {
    code: 'AU-NSW',
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
    code: 'AU-ACT-Bus',
    networkName: 'Transport Canberra',
    networkWikidata: 'Q4650892',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://www.transport.act.gov.au/googletransit/google_transit_with_schools.zip',
    },
    licenseWaiverUrl: undefined,
  },
  {
    code: 'AU-ACT-LightRail',
    networkName: 'Canberra Metro',
    networkWikidata: 'Q16927042',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://www.transport.act.gov.au/googletransit/google_transit_lr.zip',
    },
    licenseWaiverUrl: undefined,
    operatorMap: {
      'Canberra Metro Operations': {
        name: 'Canberra Metro Operations',
        wikidata: 'Q133816132',
      },
    },
    ignoreRoutes: ['X1', 'X2'],
  },
  {
    code: 'AU-QLD-Translink-SEQ',
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
