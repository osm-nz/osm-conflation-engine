import type { NetworkConfig } from '../types/config.def.ts';

export const AU: NetworkConfig[] = [
  {
    code: 'AU-NSW',
    networkName: 'TfNSW',
    networkWikidata: 'Q7834923',
    gtfsSource: {
      mode: 'manual',
      url: 'https://opendata.transport.nsw.gov.au/dataset/timetables-complete-gtfs',
    },
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
  },
  {
    code: 'AU-ACT-LightRail',
    networkName: 'Canberra Metro',
    networkWikidata: 'Q16927042',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://www.transport.act.gov.au/googletransit/google_transit_lr.zip',
    },
    operatorMap: {
      'Canberra Metro Operations': {
        name: 'Canberra Metro Operations',
        wikidata: 'Q133816132',
      },
    },
    ignoreRoutes: ['X1', 'X2'],
  },
  {
    code: 'AU-QLD-SEQ',
    networkName: 'Translink',
    networkWikidata: 'Q7833625',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://gtfsrt.api.translink.com.au/gtfs/SEQ_SCH_GTFS.zip',
    },
  },
];
