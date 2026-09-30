import type { NetworkConfig } from '../types/config.def.ts';

export const NZ: NetworkConfig[] = [
  {
    code: 'NZ-AKL',
    networkName: 'AT',
    networkWikidata: 'Q4819567',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://gtfs.at.govt.nz/gtfs.zip',
    },
    ignoreRoutes: [
      'HCRU', // private harbour cruise
      'MTAR', // private prebooked waiheke ferry

      // ignore rail busses
      'RBS',
      'RBW',
      'RBO',
      'RBE',
      'RBSX',
      'RBO-A',
      'RBS-A',
      'RBE-A',
      'RBW-A',
      'RBN',
      'RBM',
    ],
    ignoreStops: {
      // britomart stops are messed up since they decommissioned platform 2 & renumbered the rest
      9002: '9001',
      9003: '9001',
      9004: '9001',

      9329: '9328', // swanson platform 2 -> 1
      9508: '9507', // manukau platform 2 -> 1
    },

    operatorMap: {
      'Tranzit Group Ltd': {
        name: 'Tranzit Group',
        wikidata: 'Q55636134',
      },
      'Go Bus': { name: 'Kinetic', wikidata: 'Q85774435' },
      'Ritchies Transport': {
        name: 'Ritchies Transport',
        wikidata: 'Q7336695',
      },
      'Waiheke Bus Company': {
        name: 'Waiheke Bus Company',
        wikidata: 'Q5508281',
      },
      'Explore Group': { name: 'Explore Group', wikidata: 'Q115631528' },
      'SeaLink Pine Harbour': {
        name: 'SeaLink Pine Harbour',
        wikidata: 'Q7439812',
      },
      'Island Direct': { name: 'Island Direct', wikidata: 'Q123290531' },
      'Pavlovich Transport Solutions': {
        name: 'Pavlovich Transport Solutions',
        wikidata: 'Q137175212',
      },
      'New Zealand Bus': { name: 'Kinetic', wikidata: 'Q85774435' },
      'Howick and Eastern': {
        name: 'Howick and Eastern',
        wikidata: 'Q137175102',
      },
      'Bayes Coachlines': {
        name: 'Bayes Coachlines',
        wikidata: 'Q137175096',
      },
      'Mahu City Express': { name: 'Mahu City Express', wikidata: '' },
      'AT Metro Bus': { name: 'AT Metro Bus', wikidata: '' }, // rail replacement busses

      Fullers360: { name: 'Fullers360', wikidata: 'Q5508281' },
      'Belaire Ferries': {
        name: 'Belaire Ferries',
        wikidata: 'Q117328118',
      },
      'SeaLink Travel Group': {
        name: 'SeaLink New Zealand',
        wikidata: 'Q7439812',
      },
      'Waikato Regional Council': {
        name: 'Waikato Regional Council',
        wikidata: 'Q84773951',
      },
      'AT Metro': { name: 'Auckland One Rail', wikidata: 'Q108501777' },
    },
  },
  {
    code: 'NZ-WLG',
    networkName: 'Metlink',
    networkWikidata: 'Q7258026',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://static.opendata.metlink.org.nz/v1/gtfs/full.zip',
    },
    ignoreTags: [
      'colour', // colours are wrong, they've used a generic blue for many bus routes
      'bicycle', // it's wrong, they've set it to 'no' for every bus, train, and ferry
    ],
    ignoreStops: {
      // rural "Fare Zone Boundary" fake stops
      '0001': null,
      '0002': null,
      '0003': null,
      '0004': null,
      '0005': null,
      '0006': null,
    },
    overrideTransportModes: {
      // school busses
      309: 712,
      313: 712,
      315: 712,
      366: 712,
      402: 712,
      421: 712,
      429: 712,
      430: 712,
      440: 712,
      441: 712,
      442: 712,
      444: 712,
      445: 712,
      460: 712,
      461: 712,
      465: 712,
      500: 712,
      501: 712,
      505: 712,
      507: 712,
      508: 712,
      509: 712,
      510: 712,
      512: 712,
      530: 712,
      611: 712,
      612: 712,
      614: 712,
      615: 712,
      616: 712,
      617: 712,
      619: 712,
      621: 712,
      623: 712,
      625: 712,
      627: 712,
      633: 712,
      634: 712,
      635: 712,
      646: 712,
      648: 712,
      654: 712,
      667: 712,
      673: 712,
      674: 712,
      677: 712,
      680: 712,
      681: 712,
      682: 712,
      685: 712,
      704: 712,
      711: 712,
      712: 712,
      715: 712,
      716: 712,
      717: 712,
      718: 712,
      719: 712,
      721: 712,
      722: 712,
      725: 712,
      726: 712,
      730: 712,
      731: 712,
      732: 712,
      734: 712,
      736: 712,
      737: 712,
      739: 712,
      740: 712,
      742: 712,
      743: 712,
      744: 712,
      745: 712,
      746: 712,
      751: 712,
      753: 712,
      754: 712,
      755: 712,
      758: 712,
      760: 712,
      762: 712,
      764: 712,
      767: 712,
      768: 712,
      769: 712,
      770: 712,
      774: 712,
      775: 712,
      776: 712,
      784: 712,
      791: 712,
      823: 712,
      825: 712,
      828: 712,
      842: 712,
      843: 712,
      848: 712,
      849: 712,
      852: 712,
      853: 712,
      854: 712,
      855: 712,
      860: 712,
      866: 712,
      868: 712,
      874: 712,
      886: 712,
      887: 712,
      888: 712,
      901: 712,
      906: 712,
      911: 712,
      915: 712,
      916: 712,
      929: 712,
      930: 712,
      931: 712,
      935: 712,
      951: 712,
      953: 712,
      955: 712,
    },
    operatorMap: {
      'Metlink Rail': {
        name: 'Transdev Wellington',
        wikidata: 'Q24088909',
      },
      'Wellington Cable Car': {
        name: 'Wellington Cable Car',
        wikidata: 'Q954278',
      },
      Uzabus: { name: 'Uzabus', wikidata: '' },
      'Uzabus (Horizons)': { name: 'Uzabus', wikidata: '' },
      'Mana Coach Services Limited': {
        name: 'Mana Newlands Coach Services',
        wikidata: '',
      },
      'Tranzit Coachlines': {
        name: 'Tranzit Group',
        wikidata: 'Q55636134',
      },
      'NZ Bus': { name: 'NZ Bus', wikidata: 'Q6956272' },
      'East By West Ferry': {
        name: 'East By West',
        wikidata: 'Q117461595',
      },
    },
  },
  {
    code: 'NZ-WKT',
    networkName: 'BUSIT',
    networkWikidata: 'Q24998601',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://wrcscheduledata.blob.core.windows.net/wrcgtfs/busit-nz-public.zip',
    },
    operatorMap: {
      Busit: { name: '', wikidata: '' },
    },
    overrideTransportModes: {
      HUIA: 106,
    },
  },
  {
    code: 'NZ-BOP',
    networkName: 'BayBus',
    networkWikidata: 'Q112189811',
    gtfsSource: {
      mode: 'automatic',
      // eslint-disable-next-line unicorn/prefer-https -- website only supports http
      url: 'http://gtfs.dynamis.live/boprc/prod/boprc-nz.zip',
    },
  },
  {
    code: 'NZ-MWT',
    networkName: 'Horizons',
    networkWikidata: 'Q124314259',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://www.horizons.govt.nz/HRC/media/Data/files/tranzit/HRC_GTFS_Production.zip',
    },
  },
  {
    code: 'NZ-TKI',
    networkName: 'Taranaki Regional Council',
    networkWikidata: 'Q16926647',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://data.trilliumtransit.com/gtfs/trc-nz/trc-nz.zip',
    },
    includeAllStops: true,
    useStopId: true,
    operatorMap: {
      Tranzit: { name: 'Tranzit Group', wikidata: 'Q55636134' },
      'Pickering Motors': {
        name: 'Pickering Motors',
        wikidata: 'Q134292429',
      },
      'Weir Bros': { name: 'Weir Bros', wikidata: 'Q16926647' },
    },
  },
  {
    code: 'NZ-NSN',
    networkName: 'eBus',
    networkWikidata: 'Q133818760',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://data.trilliumtransit.com/gtfs/nsn-nz/nsn-nz.zip',
    },
  },
  {
    code: 'NZ-CHC',
    networkName: 'Metro Christchurch',
    networkWikidata: 'Q7258007',
    gtfsSource: {
      mode: 'manual',
      url: 'https://apis.metroinfo.co.nz/rti/gtfs/v1/gtfs.zip',
    },
  },
  {
    // TODO: follow up to the latest response
    code: 'NZ-NTH',
    networkName: 'Citylink Whangārei',
    networkWikidata: 'Q112189837',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://data.trilliumtransit.com/gtfs/nrc-nz/nrc-nz.zip',
    },
  },
  {
    // TODO: follow up to the latest response
    code: 'NZ-HWK',
    networkName: 'goBay',
    networkWikidata: 'Q112189822',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://data.trilliumtransit.com/gtfs/hbrc-nz/hbrc-nz.zip',
    },
  },
  // Gisborne has bus services but no GTFS feed
  // Southland has bus services but no GTFS feed
  // Marlborough has bus services but no GTFS feed
  // West Coast has no public transport
  // Chatham Islands have no public transport
  {
    code: 'NZ-OTG',
    networkName: 'Otago Regional Council',
    networkWikidata: 'Q7108351',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://www.orc.govt.nz/transit/google_transit.zip',
    },
  },
];
