import { VehicleType } from 'gtfs-types';
import type { NetworkConfig } from '../types/config.def.js';

export const AU: NetworkConfig[] = [
  {
    code: 'AU-NSW',
    region: 'AU-NSW',
    networkName: {
      [VehicleType.GENERIC_BUS]: 'Transport Buses',
      [VehicleType.SCHOOL_BUS]: 'Transport Buses',
      [VehicleType.FERRY]: 'Sydney Ferries',
      [VehicleType.TRAIN]: 'Sydney Trains',
      [VehicleType.METRO_RAIL]: 'Sydney Metro',
      [VehicleType.LIGHT_RAIL]: 'Sydney Light Rail',
      [VehicleType.REGIONAL_RAIL]: 'NSW TrainLink',
      [VehicleType.REGIONAL_COACH]: 'NSW TrainLink',
      __default: 'TfNSW',
    },
    networkWikidata: {
      [VehicleType.GENERIC_BUS]: 'Q5001345',
      [VehicleType.SCHOOL_BUS]: 'Q5001345',
      [VehicleType.FERRY]: 'Q3162795',
      [VehicleType.TRAIN]: 'Q7660181',
      [VehicleType.METRO_RAIL]: 'Q14774571',
      [VehicleType.LIGHT_RAIL]: 'Q771666',
      [VehicleType.REGIONAL_RAIL]: 'Q6955406',
      [VehicleType.REGIONAL_COACH]: 'Q6955406',
      __default: 'Q7834923',
    },
    overrideTransportModes: {
      L1: VehicleType.LIGHT_RAIL,
      L2: VehicleType.LIGHT_RAIL,
      L3: VehicleType.LIGHT_RAIL,
      LX: VehicleType.LIGHT_RAIL,
      L4: VehicleType.LIGHT_RAIL,
      NLR: VehicleType.LIGHT_RAIL,
    },
    gtfsSource: {
      mode: 'manual',
      url: 'https://opendata.transport.nsw.gov.au/dataset/timetables-complete-gtfs',
    },
    licenseWaiverUrl: 'https://osm.wiki/Contributors#Transport_for_NSW',
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
  {
    code: 'AU-SA',
    region: 'AU-SA',
    networkName: 'Adelaide Metro',
    networkWikidata: 'Q4681753',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://gtfs.adelaidemetro.com.au/v1/static/latest/google_transit.zip',
    },
    licenseWaiverUrl:
      'https://osm.wiki/File:Data.sa.gov.au_CCBYPermission_Open_Street_Map.pdf',
    useStopId: true,
  },
  {
    code: 'AU-TAS',
    region: 'AU-TAS',
    networkName: 'Metro Tasmania',
    networkWikidata: 'Q6824728',
    gtfsSource: {
      mode: 'manual',
      url: 'https://www.transport.tas.gov.au/public_transport/gtfs-data',
    },
    licenseWaiverUrl:
      'https://osm.wiki/File:TAS_StateGrowth_GTFS_OSM_Waiver_signed.pdf',
  },
  {
    code: 'AU-VIC-1',
    region: 'AU-VIC',
    networkName: 'PTV - Regional Trains',
    networkWikidata: 'Q7257648',
    gtfsSource: {
      mode: 'manual',
      url: 'https://opendata.transport.vic.gov.au/dataset/gtfs-schedule#1',
    },
    licenseWaiverUrl: 'https://osm.wiki/File:DTP_Waiver_signed.pdf',
  },
  {
    code: 'AU-VIC-2',
    region: 'AU-VIC',
    networkName: 'PTV - Metropolitan Trains',
    networkWikidata: 'Q7257648',
    gtfsSource: {
      mode: 'manual',
      url: 'https://opendata.transport.vic.gov.au/dataset/gtfs-schedule#2',
    },
    licenseWaiverUrl: 'https://osm.wiki/File:DTP_Waiver_signed.pdf',
  },
  {
    code: 'AU-VIC-3',
    region: 'AU-VIC',
    networkName: 'Yarra Trams',
    networkWikidata: 'Q16927551',
    gtfsSource: {
      mode: 'manual',
      url: 'https://opendata.transport.vic.gov.au/dataset/gtfs-schedule#3',
    },
    licenseWaiverUrl: 'https://osm.wiki/File:DTP_Waiver_signed.pdf',
  },
  {
    code: 'AU-VIC-4',
    region: 'AU-VIC',
    networkName: 'PTV - Metropolitan Buses',
    networkWikidata: 'Q7257648',
    gtfsSource: {
      mode: 'manual',
      url: 'https://opendata.transport.vic.gov.au/dataset/gtfs-schedule#4',
    },
    licenseWaiverUrl: 'https://osm.wiki/File:DTP_Waiver_signed.pdf',
  },
];
