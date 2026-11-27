import { describe, expect, it } from 'vitest';
import type { Vec2 as Coord } from '../../types/callbacks.def.js';
import { simplify } from '../simplify-geometry.js';
import testCases from './simplify.geo.json' with { type: 'json' };

describe(simplify, () => {
  it('can simplify ways', () => {
    const input = testCases.features[0]!.geometry.coordinates as Coord[];
    const output = testCases.features[1]!.geometry.coordinates as Coord[];

    expect(input).toHaveLength(64);
    expect(output).toHaveLength(25);

    const simplified = simplify(input, 0.00003);
    expect(simplified).toHaveLength(25);
    expect(simplified).toStrictEqual(output);
  });
});
