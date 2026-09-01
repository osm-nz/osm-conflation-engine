import { describe, expect, it } from 'vitest';
import { parseOperator } from '../conflation.js';

describe(parseOperator, () => {
  it('works', () => {
    expect(
      parseOperator(
        'https://github.com/osm-nz/linz-address-import/actions/runs/33222149044#k-yle',
      ),
    ).toStrictEqual({
      provider: 'github.com',
      org: 'osm-nz',
      repo: 'linz-address-import',
      runId: '33222149044',
      triggerer: 'k-yle',
    });
  });
});
