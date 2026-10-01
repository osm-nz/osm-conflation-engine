import type { NetworkConfig } from '../types/config.def.js';

export const CZ: NetworkConfig[] = [
  {
    code: 'CZ-IDSJMK',
    region: 'CZ-64',
    networkName: 'Integrovaný dopravní systém Jihomoravského kraje',
    networkWikidata: 'Q12020731',
    gtfsSource: {
      mode: 'automatic_and_CORS',
      url: 'https://www.arcgis.com/sharing/rest/content/items/379d2e9a7907460c8ca7fda1f3e84328/data',
    },
    licenseWaiverUrl: 'https://osm.wiki/File:OSMCZ_žádost_o_data.pdf',
  },
];
