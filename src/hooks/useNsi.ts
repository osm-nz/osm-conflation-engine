import md5 from 'md5';
import { useAsync } from './useAsync';

export interface NsiLogos {
  facebook?: string;
  twitter?: string;
  wikidata?: string;
}

export interface Nsi {
  wikidata: {
    [qId: string]: {
      description: string;
      identities: { [socialMediaPlatform: string]: string };
      label: string;
      logos?: NsiLogos;
      officialWebsites: string[];
    };
  };
}

const nsiPromise = fetch(
  'https://cdn.jsdelivr.net/npm/name-suggestion-index@6/dist/wikidata.json',
).then((r) => r.json() as Promise<Nsi>);

export const useNsi = () => useAsync(() => nsiPromise, []);

export function getLogo(logos: NsiLogos) {
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
