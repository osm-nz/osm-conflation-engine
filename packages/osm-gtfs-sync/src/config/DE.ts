import type { NetworkConfig } from '../types/config.def.js';

export const DE: NetworkConfig[] = [
  {
    code: 'DE-BY-MVV',
    region: 'DE-BY',
    networkName: 'Münchner Verkehrs- und Tarifverbund',
    networkWikidata: 'Q259000',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://www.mvv-muenchen.de/fileadmin/mediapool/02-Fahrplanauskunft/03-Downloads/openData/mvv_gtfs.zip',
    },
    licenseWaiverUrl:
      'https://osm.wiki/Contributors#Münchner_Verkehrs-_und_Tarifverbund_GmbH_(MVV)',
  },
  {
    code: 'DE-SN-MDV',
    region: 'DE-SN',
    networkName: 'Mitteldeutscher Verkehrsverbund',
    networkWikidata: 'Q1742463',
    gtfsSource: {
      mode: 'automatic',
      url: 'https://www.mdv.de/media/file/9aa23703',
    },
    licenseWaiverUrl:
      'https://osm.wiki/Contributors#Sachsen,_Thüringen,_Sachsen-Anhalt',
  },
];
