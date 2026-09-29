//
// this file is copied from https://github.com/openstreetmap/iD/pull/9988
//
import tag2link from 'tag2link' with { type: 'json' };

const RANKS = ['deprecated', 'normal', 'preferred'];

function convertSourceData(input: tag2link.Tag2Link[]) {
  const output: Record<string, string> = {};

  const allKeys = new Set(input.map((item) => item.key));

  for (const key of allKeys) {
    // find the item with the best rank
    const bestDefinition = input
      .filter((item) => item.key === key)
      .toSorted((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank))[0]!;

    output[key.replace('Key:', '')] = bestDefinition.url;
  }

  return output;
}

export const TAG2LINK = convertSourceData(tag2link as never);
