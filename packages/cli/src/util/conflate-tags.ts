import type { Tags } from 'osm-api';
import type { TagDiff } from '@osm-conflation-engine/cli';

/** from https://github.com/openstreetmap/iD/blob/e76633e1c1fd014774081956d0375e3e81b534da/modules/osm/tags.ts#L398-L407 */
const NO_KEYS: Record<string, string[]> = {
  name: ['noname'],
  ref: ['noref'],
  'addr:housenumber': ['nohousenumber', 'noaddress'],
  'addr:housename': ['noaddress'],
  'addr:unit': ['noaddress'],
  'addr:street': ['addr:nostreet'],
};

export namespace conflateTags {
  export interface Options {
    /**
     * we will never override the values of these keys,
     * we only set the value if the key is missing.
     */
    keysToRespect?: string[];

    /**
     * if every key in the diff is listed in this array,
     * then it will be treated as no diff/perfect.
     * For example, if you add `name` to this array, and
     * if the only tag that needs updating is `name`, then
     * there will be no suggested change.
     * @default []
     */
    trivialKeys?: string[];

    /**
     * by default, if you expect the value to be `a;b`,
     * then the value must be exactly `a;b` or `b;a`.
     *
     * But if you enable this option, then the OSM value is
     * allowed to contain extra values which the source did
     * not specify. For example `a;b;c`, `a;c;b`, `b;a;c;d`.
     * @default false
     */
    acceptExtraValuesInSemi?: boolean;

    /**
     * if true, then values with semicolons must use exactly
     * the same order, and {@link acceptExtraValuesInSemi}
     * cannot be used.
     *
     * If false, then the order is not enforced - i.e. if the
     * source specifies `a;b`, then `b;a` is also allowed.
     *
     * @default false
     */
    enforceExactSemiMatch?: boolean;

    /**
     * If true, a tag like `not:a=1` will tell the conflation
     * step to avoid overriding key `a` if the value is `1`.
     *
     * Likewise, if the expected tags are `a=1;2;3` and the
     * actual tags are `not:a=1`, then the diff will be `a=2;3`.
     *
     * In addition to the `not:` lifecycle prefix, `no*` tags are
     * also respected. For example, if the actual tags are
     * `noname=yes`, then `name` will not be conflated, even if
     * it exists in the expected tags
     *
     * @default false
     */
    respectNotTags?: boolean;
  }
}

export function conflateTags(
  expected: Tags,
  actual: Tags | undefined,
  options?: conflateTags.Options,
): TagDiff {
  if (options?.enforceExactSemiMatch && options?.acceptExtraValuesInSemi) {
    console.warn(
      '[conflateTags] cannot enable enforceExactSemiMatch and acceptExtraValuesInSemi',
    );
  }

  const tagDiff: TagDiff = {};
  for (const [key, value] of Object.entries(expected)) {
    if (
      options?.respectNotTags &&
      actual &&
      NO_KEYS[key]?.some((noKey) => actual[noKey] === 'yes')
    ) {
      continue; // e.g. skip conflating name=* if noname=yes exists
    }

    if (!actual?.[key]) {
      // if the OSM tag is missing
      tagDiff[key] = value;
      continue;
    }
    // value exists and we are not meant to conflate this tag
    if (options?.keysToRespect?.includes(key)) continue;

    if (actual[key] === value) continue; // perfect

    const not = actual[`not:${key}`];
    if (not === value && options?.respectNotTags) continue; // explicit instruction to skip

    // not perfect, so try an approx match
    const trySemiColonMatch =
      (actual[key].includes(';') || value.includes(';')) &&
      !options?.enforceExactSemiMatch;
    if (trySemiColonMatch) {
      const actualV = new Set(actual[key].split(';').map((v) => v.trim()));
      const expectedV = new Set(value.split(';'));

      if (not && options?.respectNotTags) {
        // if not:a=1;2 then `1` and `2` will be removed from expectedV
        for (const k of not.split(';')) {
          expectedV.delete(k.trim());
        }
      }

      const toAdd = expectedV.difference(actualV);
      const toDelete = actualV.difference(expectedV);

      if (toAdd.size) {
        // some values are missing
        for (const v of toAdd) {
          tagDiff[key] ||= actual[key];
          tagDiff[key] += `;${v}`;
        }
      }

      if (!options?.acceptExtraValuesInSemi && toDelete.size) {
        // extra values are not accepted, so delete anything in toDelete
        tagDiff[key] ||= actual[key];
        tagDiff[key] = tagDiff[key]
          .split(';')
          .map((v) => v.trim())
          .filter((v) => !toDelete.has(v))
          .join(';');
      }
      continue;
    }

    // still no match, and there are no semicolons, so fully override the value
    tagDiff[key] = value;
  }

  if (
    options?.trivialKeys &&
    Object.keys(tagDiff).every((key) => options?.trivialKeys?.includes(key))
  ) {
    // skip, since 100% of the diff is in trivialKeys
    return {};
  }

  return tagDiff;
}

export function mergeTags(...tagsList: Tags[]): Tags {
  const temp: Record<string, Set<string>> = {};
  for (const tags of tagsList) {
    for (const key in tags) {
      temp[key] ||= new Set();
      for (const value of tags[key]!.split(';')) {
        if (value) {
          temp[key].add(value.trim());
        }
      }
    }
  }

  const merged: Tags = {};
  for (const key in temp) {
    merged[key] = [...temp[key]!].join(';');
  }
  return merged;
}
