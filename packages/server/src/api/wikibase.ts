import type {
  CirrusSearchPagesResponse,
  Item,
  WbGetEntitiesResponse,
} from 'wikibase-sdk';
import pkg from '../../package.json' with { type: 'json' };

const USER_AGENT = pkg.repository.url;

enum P {
  FlagImage = 'P41',
  Image = 'P28',
  Country = 'P297',
  Subdivision = 'P300',
}

function getClaim(json: WbGetEntitiesResponse, baseUrl: string, property: P) {
  const match = Object.values(json.entities).find(
    (v): v is Item => !('missing' in v),
  );
  if (!match) return undefined;

  const img = match.claims?.[property]?.[0]?.mainsnak;
  if (!img) return undefined;
  if (img.datatype !== 'string' && img.datatype !== 'commonsMedia') {
    return undefined;
  }
  if (!('datavalue' in img)) return undefined;

  const qs2 = new URLSearchParams({
    title: `Special:Redirect/file/${img.datavalue.value}`,
    width: '400',
  });
  return `${baseUrl}/w/index.php?${qs2}`;
}

export async function getImageFromOsmWikibase(key: string) {
  const baseUrl = 'https://wiki.openstreetmap.org';
  const qs = new URLSearchParams({
    action: 'wbgetentities',
    sites: 'wiki',
    titles: ['Locale:en', `Key:${key}`].join('|'),
    languages: 'en',
    languagefallback: '1',
    origin: '*',
    format: 'json',
  });
  const json = await fetch(`${baseUrl}/w/api.php?${qs}`, {
    headers: { 'User-Agent': USER_AGENT },
  }).then((r) => r.json<WbGetEntitiesResponse>());

  return getClaim(json, baseUrl, P.Image);
}

export async function getFlagFromWikidata(region: string) {
  const property = region.includes('-') ? P.Subdivision : P.Country;
  const baseUrl = 'https://www.wikidata.org';
  const qs = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: `haswbstatement:${property}=${region}`, // e.g. P300=AU-NSW
    srlimit: '5',
    origin: '*',
    format: 'json',
  });
  const searchResults = await fetch(`${baseUrl}/w/api.php?${qs}`, {
    headers: { 'User-Agent': USER_AGENT },
  }).then((r) => r.json<CirrusSearchPagesResponse>());
  const qId = searchResults.query.search[0]?.title;

  const json = await fetch(`${baseUrl}/wiki/Special:EntityData/${qId}.json`, {
    headers: { 'User-Agent': USER_AGENT },
  }).then((r) => r.json<WbGetEntitiesResponse>());

  return getClaim(json, baseUrl, P.FlagImage);
}
