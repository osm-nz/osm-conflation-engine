import type {
  CirrusSearchPagesResponse,
  Item,
  ItemId,
  WbGetEntitiesResponse,
} from 'wikibase-sdk';
import pkg from '../../package.json' with { type: 'json' };

const USER_AGENT = pkg.repository.url;

enum P {
  LogoImage = 'P154',
  LogoImageSmall = 'P8972',
  FlagImage = 'P41',
  CoatOfArmsImage = 'P94',
  Image = 'P18',
  Country = 'P297',
  Subdivision = 'P300',
}
enum P_osm {
  Image = 'P28',
}

function getClaim(
  json: WbGetEntitiesResponse,
  baseUrl: string,
  property: P | P_osm,
) {
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

export async function getImageFromWikidata(qId: ItemId, properties: P[]) {
  const baseUrl = 'https://www.wikidata.org';
  const json = await fetch(`${baseUrl}/wiki/Special:EntityData/${qId}.json`, {
    headers: { 'User-Agent': USER_AGENT },
  }).then((r) => r.json<WbGetEntitiesResponse>());

  for (const p of properties) {
    const value = getClaim(json, baseUrl, p);
    if (value) return value;
  }
  return undefined;
}

export async function getImageFromOsmWikibase(key: string) {
  if (key.includes(':wikidata=')) {
    // this is not a key at all, it's a tag like `*:wikidata=...`.
    // for this case, we return the image from wikidata
    return getImageFromWikidata(key.split('=', 2)[1]! as ItemId, [
      P.Image,
      P.FlagImage,
      P.CoatOfArmsImage,
      P.LogoImage,
      P.LogoImageSmall,
    ]);
  }

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

  return getClaim(json, baseUrl, P_osm.Image);
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
  const qId = searchResults.query.search[0]?.title as ItemId | undefined;
  if (!qId) return undefined; // invalid country code

  return getImageFromWikidata(qId, [P.FlagImage, P.CoatOfArmsImage]);
}
