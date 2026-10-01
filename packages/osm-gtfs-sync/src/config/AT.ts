import type { NetworkConfig } from '../types/config.def.js';

export const AT: NetworkConfig[] = [
  {
    code: 'AT-OOeVV',
    networkName: 'Oberösterreichischer Verkehrsverbund',
    networkWikidata: 'Q2011605',
    gtfsSource: {
      mode: 'manual',
      url: 'https://mobilitaetsverbuende.atlassian.net/wiki/spaces/DBP/pages/85524481/Nutzungsbedingungen',
    },
    licenseWaiverUrl:
      'https://osm.wiki/File:Erlaubnis_zur_Einbindung_von_CC_BY-Daten_in_OpenStreetMap.pdf',
  },
  {
    code: 'AT-SVV',
    networkName: 'Salzburger Verkehrsverbund',
    networkWikidata: 'Q1254319',
    gtfsSource: {
      mode: 'manual',
      url: 'https://mobilitaetsverbuende.atlassian.net/wiki/spaces/DBP/pages/85524481/Nutzungsbedingungen',
    },
    licenseWaiverUrl:
      'https://osm.wiki/File:Erlaubnis_zur_Einbindung_von_CC_BY-Daten_in_OpenStreetMap.pdf',
  },
  {
    code: 'AT-VKG',
    networkName: 'Kärntner Linien',
    networkWikidata: 'Q2516465',
    gtfsSource: {
      mode: 'manual',
      url: 'https://mobilitaetsverbuende.atlassian.net/wiki/spaces/DBP/pages/85524481/Nutzungsbedingungen',
    },
    licenseWaiverUrl:
      'https://osm.wiki/File:Erlaubnis_zur_Einbindung_von_CC_BY-Daten_in_OpenStreetMap.pdf',
  },
  {
    code: 'AT-VOR',
    networkName: 'VOR',
    networkWikidata: 'Q2516485',
    gtfsSource: {
      mode: 'manual',
      url: 'https://mobilitaetsverbuende.atlassian.net/wiki/spaces/DBP/pages/85524481/Nutzungsbedingungen',
    },
    licenseWaiverUrl:
      'https://osm.wiki/File:Erlaubnis_zur_Einbindung_von_CC_BY-Daten_in_OpenStreetMap.pdf',
  },
  {
    code: 'AT-VVSt',
    networkName: 'Verkehrsverbund Steiermark',
    networkWikidata: 'Q2341954',
    gtfsSource: {
      mode: 'manual',
      url: 'https://mobilitaetsverbuende.atlassian.net/wiki/spaces/DBP/pages/85524481/Nutzungsbedingungen',
    },
    licenseWaiverUrl:
      'https://osm.wiki/File:Erlaubnis_zur_Einbindung_von_CC_BY-Daten_in_OpenStreetMap.pdf',
  },
  {
    code: 'AT-VVT',
    networkName: 'Verkehrsverbund Tirol',
    networkWikidata: 'Q1668732',
    gtfsSource: {
      mode: 'manual',
      url: 'https://mobilitaetsverbuende.atlassian.net/wiki/spaces/DBP/pages/85524481/Nutzungsbedingungen',
    },
    licenseWaiverUrl:
      'https://osm.wiki/File:Erlaubnis_zur_Einbindung_von_CC_BY-Daten_in_OpenStreetMap.pdf',
  },
  {
    code: 'AT-VVV',
    networkName: 'Verkehrsverbund Vorarlberg',
    networkWikidata: 'Q2516495',
    gtfsSource: {
      mode: 'manual',
      url: 'https://mobilitaetsverbuende.atlassian.net/wiki/spaces/DBP/pages/85524481/Nutzungsbedingungen',
    },
    licenseWaiverUrl:
      'https://osm.wiki/File:Erlaubnis_zur_Einbindung_von_CC_BY-Daten_in_OpenStreetMap.pdf',
  },
];
