import { describe, expect, it } from 'vitest';
import type { Tags } from 'osm-api';
import type { TagDiff } from '@osm-conflation-engine/cli';
import { conflateTags, mergeTags } from '../conflate-tags.js';

describe(conflateTags, () => {
  describe('no settings', () => {
    it.each<[expected: Tags, actual: Tags | undefined, diff: TagDiff]>([
      [{ a: '1' }, { a: '2' }, { a: '1' }],
      [{ a: '1' }, undefined, { a: '1' }],
      [{}, {}, {}], // no diff
      [{ a: '1' }, { a: '1' }, {}], // no diff
      [{ a: '1;2' }, { a: '1;2' }, {}],
      [{ a: '1;2' }, { a: '2;1' }, {}], // wrong order is accepted
      [{ a: '1;2' }, { a: '1;2;3' }, { a: '1;2' }],
    ])('%s vs %s --> %s', (expected, actual, diff) => {
      expect(conflateTags(expected, actual)).toStrictEqual(diff);
    });
  });

  describe('keysToRespect=b', () => {
    it.each<[expected: Tags, actual: Tags | undefined, diff: TagDiff]>([
      [{ a: '1', b: '1' }, { a: '2', b: '2' }, { a: '1' }], // skip b
      [{ a: '1', b: '1' }, { a: '2' }, { a: '1', b: '1' }], // add b
    ])('%s vs %s --> %s', (expected, actual, diff) => {
      const options: conflateTags.Options = {
        keysToRespect: ['b'],
      };
      expect(conflateTags(expected, actual, options)).toStrictEqual(diff);
    });
  });

  describe('trivialKeys=b', () => {
    it.each<[expected: Tags, actual: Tags | undefined, diff: TagDiff]>([
      [
        { a: '1', b: '1' },
        { a: '2', b: '2' },
        { a: '1', b: '1' },
      ],
      [{ a: '1', b: '1' }, { a: '2' }, { a: '1', b: '1' }], // add b
      [{ a: '1', b: '1' }, { a: '1', b: '2' }, {}], // b is the only difference
    ])('%s vs %s --> %s', (expected, actual, diff) => {
      const options: conflateTags.Options = {
        trivialKeys: ['b'],
      };
      expect(conflateTags(expected, actual, options)).toStrictEqual(diff);
    });
  });

  describe('acceptExtraValuesInSemi=true', () => {
    it.each<[expected: Tags, actual: Tags | undefined, diff: TagDiff]>([
      [{ a: '1;2' }, { a: '1;2' }, {}],
      [{ a: '1' }, { a: '1;2' }, {}], // already contains 1
      [{ a: '1;2' }, { a: '1;2;3' }, {}], // already contains 1 & 2
      [{ a: '1' }, { a: '2;3' }, { a: '2;3;1' }], // missing 1
      [{}, { a: '2;3' }, {}],
      [{ a: 'black;yellow;black' }, { a: 'black;yellow' }, {}], // duplicates
    ])('%s vs %s --> %s', (expected, actual, diff) => {
      const options: conflateTags.Options = {
        acceptExtraValuesInSemi: true,
      };
      expect(conflateTags(expected, actual, options)).toStrictEqual(diff);
    });
  });

  describe('enforceExactSemiMatch=true', () => {
    it.each<[expected: Tags, actual: Tags | undefined, diff: TagDiff]>([
      [{ a: '1;2' }, { a: '2;1' }, { a: '1;2' }], // for re-order
      [{ a: '1' }, { a: '1;2' }, { a: '1' }], // already contains 1, not good enough
      [
        { a: 'black;yellow;black' },
        { a: 'black;black;yellow' },
        { a: 'black;yellow;black' },
      ], // for reorder duplicates
    ])('%s vs %s --> %s', (expected, actual, diff) => {
      const options: conflateTags.Options = {
        enforceExactSemiMatch: true,
      };
      expect(conflateTags(expected, actual, options)).toStrictEqual(diff);
    });
  });

  describe('respectNotTags=true', () => {
    it.each<[expected: Tags, actual: Tags | undefined, diff: TagDiff]>([
      [{ a: '1' }, { a: '2', 'not:a': '1' }, {}],
      [{ a: '1;2' }, { a: '2', 'not:a': '1' }, {}],
      [{ a: '1;2;3' }, { a: '2', 'not:a': '1' }, { a: '2;3' }],
      [{ name: '1' }, { noname: 'yes' }, {}],
    ])('%s vs %s --> %s', (expected, actual, diff) => {
      const options: conflateTags.Options = {
        respectNotTags: true,
      };
      expect(conflateTags(expected, actual, options)).toStrictEqual(diff);
    });
  });
});

describe(mergeTags, () => {
  it.each<[input: Tags[], output: Tags]>([
    [[{ a: '1' }, { a: '1' }], { a: '1' }],
    [[{ a: '1' }, { a: '2' }, { a: '1' }], { a: '1;2' }], // no duplicates
    [[{ a: '1;2' }, { a: '2;3' }], { a: '1;2;3' }],
    [[{ a: '1' }, { b: '2' }], { a: '1', b: '2' }],
  ])('%j --> %j', (input, output) => {
    expect(mergeTags(...input)).toStrictEqual(output);
  });
});
