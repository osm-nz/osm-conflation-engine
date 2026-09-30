import { describe, expect, it } from 'vitest';
import { hhmmss } from '../js.js';

// eslint-disable-next-line vitest/prefer-describe-function-title
describe('hhmmss', () => {
  it.each`
    input           | output
    ${0}            | ${'00:00'}
    ${0.5}          | ${'00:00'}
    ${1}            | ${'00:00:01'}
    ${60}           | ${'00:01'}
    ${61}           | ${'00:01:01'}
    ${60 * 60}      | ${'01:00'}
    ${60 * 60 + 1}  | ${'01:00:01'}
    ${60 * 60 * 24} | ${'24:00'}
    ${60 * 60 * 26} | ${'26:00' /* weird but this is how GTFS works */}
  `('$input -> $output', ({ input, output }) => {
    expect(hhmmss.fromSeconds(input)).toBe(output);
  });
});
