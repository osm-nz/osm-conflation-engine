import { describe, expect, it } from 'vitest';
import { getSector } from '../getSector.js';

describe(getSector, () => {
  it.each`
    lat           | lng           | result
    ${-47.025206} | ${167.915039} | ${'87daaaa0effffff'}
    ${-50.680797} | ${166.091308} | ${'87da18852ffffff'}
  `('works for $lat,$lng ($small)', ({ lat, lng, result }) => {
    expect(
      getSector({ type: 'Point', coordinates: [lng, lat] }, 7),
    ).toStrictEqual([result]);
  });

  it.each(<const>['MultiPoint', 'LineString'])('works for a %s', (type) => {
    expect(
      getSector(
        {
          type,
          coordinates: [
            [151.2331503, -33.8245882],
            [151.2423191, -33.8244521],
            [151.2444475, -33.8297566],
          ],
        },
        7,
      ),
    ).toStrictEqual(['87be0e22dffffff', '87be0e353ffffff']);
  });

  it('works for an unholy Polygon', () => {
    expect(
      getSector(
        {
          type: 'Polygon',
          coordinates: [
            [
              [151.2041704, -33.8372368],
              [151.2041704, -33.8372368],
              [151.2041704, -33.8372368],
              [151.2041704, -33.8372368],
            ],
          ],
        },
        7,
      ),
    ).toStrictEqual(['87be0e358ffffff']);
  });

  it('works for a holy Polygon', () => {
    expect(
      getSector(
        {
          type: 'Polygon',
          coordinates: [
            [
              [151.209505, -33.8485806],
              [151.2058917, -33.8486651],
              [151.2071131, -33.8441003],
              [151.2090979, -33.8447343],
              [151.209505, -33.8485806],
            ],
            [
              [151.2071152, -33.8465591],
              [151.2084284, -33.8465591],
              [151.2077718, -33.8472408],
              [151.2071152, -33.8465591],
            ],
          ],
        },
        7,
      ),
    ).toStrictEqual(['87be0e358ffffff', '87be0e35cffffff', '87be0e35effffff']);
  });

  it('works for a MultiPolygon', () => {
    expect(
      getSector(
        {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [151.269083, -33.8474316],
                [151.2767525, -33.8409232],
                [151.2820044, -33.8446621],
                [151.2726676, -33.8524164],
                [151.269083, -33.8474316],
              ],
            ],
            [
              [
                [151.209505, -33.8485806],
                [151.2058917, -33.8486651],
                [151.2071131, -33.8441003],
                [151.2090979, -33.8447343],
                [151.209505, -33.8485806],
              ],
              [
                [151.2071152, -33.8465591],
                [151.2084284, -33.8465591],
                [151.2077718, -33.8472408],
                [151.2071152, -33.8465591],
              ],
            ],
          ],
        },
        7,
      ),
    ).toStrictEqual([
      '87be0e350ffffff',
      '87be0e358ffffff',
      '87be0e35cffffff',
      '87be0e35effffff',
    ]);
  });
});
