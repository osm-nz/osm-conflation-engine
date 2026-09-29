import tag2link from 'tag2link' with { type: 'json' };

const RANKS = ['deprecated', 'normal', 'preferred'];

export function getFormatterUrl(key: string) {
  // ESM typedefs are wrong
  return (tag2link as never as typeof tag2link.default)
    .filter((item) => item.key === `Key:${key}`)
    .toSorted((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank))[0]?.url;
}
