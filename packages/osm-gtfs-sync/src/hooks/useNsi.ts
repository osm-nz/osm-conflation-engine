import md5 from 'md5';
import type { NsiWikidataJSON, WikidataLogos } from 'name-suggestion-index';
import { useAsync } from './useAsync.js';

const nsiPromise = fetch(
  'https://cdn.jsdelivr.net/npm/name-suggestion-index@6/dist/wikidata.json',
).then((r) => r.json() as Promise<NsiWikidataJSON>);

export const useNsi = () => useAsync(() => nsiPromise, []);

export function getLogo(logos: WikidataLogos) {
  return (
    logos.facebook ||
    logos.wikidata
      ?.replaceAll(/(%20| )/g, '_')
      .replace(/.+Special:FilePath\/(.+)/, (_, fileName) => {
        const [a, b] = md5(fileName);
        return `https://upload.wikimedia.org/wikipedia/commons/${a}/${a}${b}/${fileName}`;
      })
  );
}
