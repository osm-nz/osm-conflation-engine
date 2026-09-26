// original version: https://github.com/osm-nz/osm-nz.github.io/pull/1

import type { MantineColor } from '@mantine/core';

/** Return a deeper red for changesets with more changes */
export const COLOUR_SCALE = [
  { from: 0, colour: '#d4b9da' },
  { from: 21, colour: '#c994c7' },
  { from: 41, colour: '#df65b0' },
  { from: 61, colour: '#e7298a' },
  { from: 101, colour: '#ce1256' },
  { from: 201, colour: '#980043' },
  { from: 501, colour: '#67001f' },
  { from: 1001, colour: '#3a0000' },
];

export function getColourFromScale(totalCount: number): string {
  return COLOUR_SCALE.findLast((step) => totalCount >= step.from)!.colour;
}

export function getColourScaleLabel(index: number, locale: string): string {
  const { from } = COLOUR_SCALE[index]!;
  const next = COLOUR_SCALE[index + 1];
  return next
    ? `${from.toLocaleString(locale)}–${(next.from - 1).toLocaleString(locale)}`
    : `${from.toLocaleString(locale)}+`;
}

const BADGE_COLOURS: MantineColor[] = [
  'blue',
  'cyan',
  'grape',
  'green',
  'indigo',
  'lime',
  'orange',
  'pink',
  'red',
  'teal',
  'violet',
];
export function getColourHash(category: string): MantineColor {
  let hash = 0;
  for (const character of category) {
    hash = (hash * 31 + character.codePointAt(0)!) % 1e9;
  }
  return BADGE_COLOURS[hash % BADGE_COLOURS.length]!;
}
